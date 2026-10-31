# THE DISPATCH STANDARD

**Read this BEFORE you build a frame. Not after the panel finds it.**

This file exists because the run was relying on rounds of review to reach the bar instead
of authoring to the bar in the first place (owner, 2026-08-05: *"it seems like the video
should just be way better before it ever gets to the judges, we're relying on so many
rounds of improvements and it's masking the fact that whoever is creating the video just
needs to be upgraded based on everything that the judges have been saying"*).

Everything below is a defect that a judge actually found, in a real round, with a
measurement. None of it is theory. If you build to this list, the first cut arrives at
roughly the score the fifth cut used to, and the panel gets to spend its attention on the
things that are genuinely a matter of taste.

**The rule for this file: every time the panel finds something that was knowable in
advance, it comes back here.** A finding that recurs across runs is a failure of this
document, not of the judge.

---

## 0. The two questions to ask before building any shot

1. **What moves, continuously, for the whole time this shot is on screen?** Not "what
   event happens" — what is never still. Shots hold for 6 to 11 seconds. An event at the
   top and an event at the bottom leaves a dead middle, and dead middles are where every
   retention note comes from.
2. **What is the one thing a viewer is meant to look at, and is it the best-finished
   thing in the frame?** The recurring illustration note is never "this is badly drawn."
   It is always "the hero reads plainer than the props around it."

---

## 1. Props and hands (illustration craft, weight 0.16 — the heaviest axis)

- **Every prop a character holds must be parented to a documented hand anchor.** Do not
  place a prop near a hand and eyeball it. The rig's poses publish their anchors; use them.
  `carry` puts the fist at `(X + 120*S*facing, Y - 190*S)` for a figure at
  `translate(X,Y) scale(S)`.
- **A holdable prop's transform origin is its GRIP POINT**, not its centre of mass. If the
  origin is the middle of the object, "put it in the hand" becomes a rotation problem you
  have to solve by eye every time, and you will get it wrong. `DripTorch` is the worked
  example.
- **Draw the prop after the figure and close fingers over it** in the figure's own skin
  tone, with a contact/AO tick where the fist meets the handle. A hand behind a handle
  reads as a hand near a handle.
- **Everything resting on the ground gets a contact shadow.** Boots, posts, dropped tools,
  machines, card stacks. The single most repeated craft finding in this film's history is
  an object with no AO pool while three objects beside it have one. If it touches ground,
  it casts.
- **Nothing floats.** If a sign, card or plate is in the air, either a hand holds it or a
  stake holds it. "It fades in" is not support.
- **Finish parity.** Do not put a flat single-fill surface in a frame with a gradient-lit,
  ink-outlined, rivet-detailed one. That includes hands, boots, treelines and map fills.
  On small forms (a 15px palm) a bounding-box gradient spans too few pixels to read — use a
  core-shade crescent and a cast tick instead.

## 2. Motion (weight 0.12)

- **Every held figure needs idle life**: a breath cycle and a lateral weight shift, phase
  offset per figure so two people in a frame are never in lockstep.
- **Every held PROP gets the same, for free: wrap it in `<HeldProp>`** (`lib/heldidle.tsx`,
  machine pass 2026-10-15, after five straight films had a panel name a held prop frozen). Give
  it the prop's pivot, rough size, a `kind` ('rest' on a surface, 'hang' for a plate or sign,
  'float' for a token or card) and a per-prop `seed`, and wrap the label the prop carries with it.
  It adds a continuous rock, irregular settle nudges and a soft light pass on the prop's own
  silhouette (2.8 to 6.2 percent median change on the prop in `HeldPropLook`, 0 when bare). A whole-
  frame camera drift is not prop life: motion_registered solves it out and judges still call the
  prop frozen. `gain={0}` only where stillness is the point.
- **A held beat needs AREA in motion, so give the held thing a travelling element: `<HeldTravel>`**
  (`lib/heldidle.tsx`, machine pass 2026-10-26, after 10-22, 10-24, 10-25 and 10-26 panels all
  capped Motion on beats under 6 percent with the camera solved out, twelve strips on 10-26). The
  rock moves a prop's edges and lifts a frame about one point; a sweep of light across it, a shadow
  drifting over it, or a runner along its cord lifts a 460x320 sheet 2.5 points more
  (`python3 scripts/held_travel_look_check.py`). 'sweep' for a mid-tone or dark thing, 'shadow' for a
  pale sheet or wall, 'runner' with a `path` for a cord, wire or rail. It draws no text and never
  counts as cover over a label. `make_cut.sh` runs `held_beat_check.py --source` before the render
  and its NOTE line names each HELD beat by shot: put a HeldTravel on those, not a bigger camera move.
- **The weight shift is applied ABOVE the feet.** Applying it at the character root slides
  the boots and their contact shadows along the ground, which reads as skating. Torso
  carries the full shift, legs about a third, boots stay planted.
- **A gesture is not a pose.** If a character points, the arm must arrive: windup below
  zero, extension, overshoot past the target, settle. An arm that is already extended in
  the first frame of its shot and holds for six seconds is a pose wearing a gesture's
  clothes, and judges have called it out every time.
- **Point at things that exist.** If the gesture lands on an object, drive the gesture from
  the same value that brings the object in.
- **No shot may go quiet.** Anything held longer than ~6s needs a continuous animation that
  spans the WHOLE hold, not one that completes in the first third and then sits.
- **The camera does not punctuate beats** (owner, 2026-10-03: "every like five seconds ... the
  screen is shaking slightly ... It's happening so frequently that it's just kind of
  overstimulating"). The 10-02 and 10-03 films kicked the whole frame, a 3 px jitter and a 2
  percent zoom punch, on every board beat: 41 jolts in a 114 s story, one every 2.8 s. An impact
  lands in the OBJECT: squash, overshoot, a star, a dust puff, the desk under it jumping. The
  whole frame kicks only on a beat the board flags `"kick": true`, at most three a film and 20 s
  apart, through `lib/camera.ts`. VO accents move bodies, never the frame, and never the grade's
  bloom. `scripts/jolt_check.py` measures the master and preflight fails a film over budget. A
  judge who asks for camera shake on an impact is asking for this defect back: answer with the
  object.

## 3. Composition and staging (weight 0.08 — historically the lowest-scoring axis)

- **The 9:16 master is the graded cut. Compose FOR it.** The square is derived by
  `crop=1080:1080:0:420`. Content outside y 420..1500 is free canvas that stages the
  vertical and never appears in the square — use it (atmosphere and ridges above, near
  foreground below). Do not build for the square band and let the rest be padding.
- **No overlay may occlude a character silhouette.** Compute it, do not eyeball it: the
  hard hat crown sits at `1180 - 454*scale` in scene space. A card that amputates the
  hero's head held for 2.8 seconds is the kind of thing that reads as broken, not as busy.
- **No shot should be more than ~40% unmodulated empty fill.** Judges measure this with a
  low-gradient-area metric and the dead zones always coincide with the longest holds, which
  is the worst possible alignment.
- **The persistent brand mark is not exempt from staging.** Keep it off the hero, off the
  map, off information cards, and on one anchor. A mark that wanders between shots or cuts
  a coastline reads as an artifact.
- **Depth planes must stack possibly.** Ground may not have sky below it. If a background
  layer closes at a fixed y, check what is under it before the next plane starts.

## 4. Typography and on-screen strings (weight 0.06, but a blocker class)

- **Size the plate to the string, never the reverse.** Mono advance is exact
  (0.602em), so a mono string's width is arithmetic, not judgement:
  `len * size * 0.602 + letterSpacing * (len - 1)`. Minimum 14px clear on both sides.
- **Run `scripts/text_fit_check.py` BEFORE rendering.** It reads source and needs no
  frames. Read its coverage line, not just its exit code: a pass with the string you care
  about sitting in the "not measured" list is not a pass on that string.
- **Re-measure the plate every time you change the type.** Every single overflow in this
  film's history came from enlarging type to answer a legibility note without re-measuring
  the box behind it.
- **Watch descenders between stacked runs.** A 66px figure's comma descends ~14px and will
  strike a qualifier line set 24px below its baseline.
- **A mark that negates must negate the right thing.** A strike through a word cancels that
  word. If the point is an absence, strike the empty slot, not the label naming it.

## 5. Captions and audio (weight 0.10 sound, plus caption blockers)

- **Captions render through `lib/captions` (`CaptionBar`, or `captionRows` + `activeCue`), never
  an episode-local copy of the breaker.** Eight runs re-learned "caught in the / Aleutians" in
  their own copy. `scripts/caption_render_check.py` runs the lib breaker over the cues and fails
  a row or card that ends on a dangling word; re-cue or reword, never pad.
- **Caption text comes from the SCRIPT. Caption timing comes from the AUDIO. Both must
  match the DELIVERED stem.** ASR transcripts are for placing words in time and nothing
  else.
- **After any VO re-synth, every artifact that states the narration moves together**:
  `vo.wav`, `vo_lines.json`, `vo_script.txt`, `vo_script.json`, `captions.json`,
  `words.json`. Missing one of these has produced a hard blocker twice, both times because
  the caption said something the voice did not.
- **Re-align after patching audio.** A `words.json` older than the `vo.wav` it describes is
  a stale artifact that will burn wrong text on screen.
- **Never write a measurement into the evidence pack by hand.** `audio_report.json` carried
  a hand-typed claim that the VO left "one gap over 0.35s"; there were 21. It sent three
  rounds of fixes in the wrong direction. Generate it (`scripts/audio_report.py`).
- **LRA comes from genuinely quiet moments.** Raising the bed INTO gaps narrows the spread
  and does not help. If the loudness range is flat, the fix is real air, which means
  trimming VO, which is cheap: `vo_patch_lines.py` fits a shorter line inside its existing
  slot and no downstream boundary moves.

## 6. Accuracy and the ledger (weight 0.10)

- **`on_screen` records the string the film PAINTS, not the claim it supports.** If the
  film paints a chip reading `CURRICULUM`, that is the on_screen value.
- **`spoken` records what the delivered audio SAYS**, verified against the stem, not what
  the script planned.
- **`verbatim_source` takes exactly three forms and each declares itself**: a literal
  quotation opening with a quote mark and containing no added emphasis or elision; a
  structured field citation written `field: "value"`; or a labelled non-quotation that says
  so in its first words. A pointer like "same sentence as c7" is none of these.
- **Reconcile the ledger against the delivered cut before the ship step, not after.** Four
  records described a cut that no longer existed as recently as round 12.
- **An attributed subtitle must be safe to read as a quote.** If you compress a source
  sentence, either restore the clause or drop the attribution tag.

## 7. Hook (weight 0.12)

- **Something must MOVE in the first half second**, and a plate easing in does not count —
  a judge read a 0.3s scale-and-settle entrance as "a placard slide". Use a real interrupt:
  an ignition, a hard snap with overshoot, a value slamming to its stop.
- **Do not arrive fully painted.** If the composition is complete at frame 1, the first
  seconds have nothing to give.
- **Bookend it.** The strongest thing this film does is return to the opening image
  inverted. Build the open knowing what the button will do to it.

---

## The pre-render checklist

Run these before you spend twelve minutes on a render, in this order. All are cheap and
all read source or existing artifacts:

```
python3 scripts/text_fit_check.py         # plated strings fit, with coverage stated
npx tsc --noEmit -p video-engine/tsconfig.json
```

And after the render, before the panel:

```
bash   scripts/encode_deliverables.sh     # aspect + delivered-audio asserts
python3 scripts/audio_report.py           # measured, never hand-written
python3 scripts/dead_space_check.py --every 30
python3 scripts/crop_safety.py            # the derived square, mechanically
python3 scripts/build_evidence.py
```

A gate that reports zero measurements is a failure, not a pass. Every one of these prints
what it actually checked; read that line.

---

## 8. Things the 2026-08-05 panel found that were knowable in advance

Added under this file's own maintenance rule. Each one is a defect a judge actually
found on "The Net Comes First", with the measurement, and each was avoidable.

- **A scene built only out of `interpolate()` events is a slideshow.** An event that has
  finished is a still photograph, and §2's "no shot may go quiet" was read as being about
  long holds when it is really about EVERY frame. A frame-difference sweep of that film's
  first delivered cut found 76.6 percent of frames at or above 99 percent identical to the
  frame before, with a 13.5 second unbroken run. **Every scene wrapper carries a continuous
  slow push (about 1.00 to 1.10 across the shot) plus a lateral drift on an irrational
  period, and one always-running ambient layer, before any event is authored.** Measure it,
  do not eyeball it:
  `ffmpeg -i cut.mp4 -vf "scale=160:284,tblend=all_mode=difference,blackframe=amount=0:threshold=6" -f null -`
  and read the pblack values. Anything over about 60 percent means the film is mostly still.
- **A silhouette used by the absence grammar must carry the whole subject.** `lib/absence.tsx`
  strokes a path with no fill, so whatever the path omits simply is not there. A beetle's
  elytra outline, unfilled, is an egg, and that film's hook AND its signature shot were both
  built on the dashed form. Export a full silhouette (body plus head, limbs and antennae) for
  anything that will be drawn as an absence, and look at it dashed before building on it.
- **Evidence-pack filmstrip anchors are PER-RUN DATA.** `scripts/build_evidence.py`'s strip
  list still held the previous film's beat names, so two strips sampled the same shot and a
  judge correctly reported that one beat "reuses the identical still" from another. It was
  the sampler pointing twice at one scene. A run that changes the film changes those anchors
  in the same commit, and the offsets are CONTACT times, not line starts plus a guess.
- **A `Character` rig next to form-shaded props needs an explicit `ContactShadow` and
  comparable staging scale.** Three judges independently wrote that the human read flatter
  than the cabinet beside him. The rig is form-shaded internally, so the tell is not the
  shading, it is that everything around him casts and he did not.
- **A gate that rules a net-new asset a duplicate of the shelf is usually answered by moving
  its SHAPE LANGUAGE, not by arguing behaviour.** Gate 0D correctly called the first
  `NameEngine` a second `AshReader`. The differences on offer were behavioural and a viewer
  cannot see behaviour in a silhouette. Putting the machine on the opposite side of the
  film's own shape grammar fixed it and made the film better.

- **VERIFY A FIX RENDERED BEFORE YOU DEFEND IT TO A JUDGE.** This cost four panel rounds on
  2026-08-05. Three judges said the newsprint beat was frozen; the run reported it fixed
  twice, and both reports were false. The edits were string replacements written against
  source text an earlier edit had already changed, so they matched nothing and silently
  no-opped. **A no-op edit is indistinguishable from a delivered fix from the orchestrator's
  side**, and the panel is the only thing that catches it, which is the most expensive
  possible place to catch it. After any fix to a specific beat: re-render, re-cut that
  beat's strip, and LOOK at it. If the judges disagree with you about a frame, they are
  looking at the frame and you are looking at your intention.
- **"It measurably changes every frame" is not the same as "it moves".** The same beat
  measured 100 percent of frames changing while being visually static, because the change
  was dust and a sub-pixel push. The judge's arithmetic is the right test: a moving element
  should traverse a visible fraction of the frame inside the 8-frame, 0.27 second window the
  evidence pack samples. If it moves 40px in a 1080px frame, it is a rounding error to a
  viewer. Size the motion to the window it will be judged in.
- **Check what is actually on screen at the moment you are fixing.** The machine meant to
  carry that beat had opacity 0 for the first five seconds of its own shot, so the newspaper
  was the entire frame and nothing in it moved. Before animating a scene, list what is
  visible at the timecode in question.

## 9. Things the 2026-10-02 panel found that were knowable in advance

- **A plate inside a LIBRARY component sizes itself to its string, by arithmetic, like an
  episode Plate does.** The NIR reader's nameplate was a fixed 340px rect, so TRAINED ON THE
  ARCHIVE rendered as "RAINED ON THE ARCHIV" in two shots and was the round's hard blocker.
  `plateW` exists for exactly this. Any lib component that paints a caller's string (a
  nameplate, a counter label, a drum label) computes its width from the string's length.
- **One recurring sign is one component.** WHO COUNTED? appeared on three different plate
  treatments, so the loop object did not read as the same object when it paid off. Draw the
  film's question, its section title and its quote plaques with ONE sign component, and let
  the payoff flip the sign the viewer already knows.
- **A hand at hero scale is inked and form-shaded, and a pen's tip sits on the mark it
  makes.** A flat skin-colour silhouette read as clip art next to modelled brass. When a hand
  holds a pen, place it FROM the tip: compute the pinch point from where the line ends, never
  the reverse, or the pen points away from its own line.
- **A reader at a microscope has an eye at the eyepiece.** Derive the scope's position from
  the rig's face (feet minus about 400 times scale), and keep that offset when the same pair
  reappears at background scale.
- **A figure lands once.** A stat shown as a burst, a chip and a plate in the same frame is
  stated three times and read zero times. One hero treatment per figure, with its attribution
  riding on it.
- **A hedged figure carries its hedge every time it is drawn.** The 1878 birth year is an
  estimate (claim c6), so EST., ESTIMATED or ABOUT goes on every surface that shows it.
- **Caption cards break by sense.** One card per sentence or clause, rows split at a comma or
  before a preposition, never after an article, a possessive or a number, never inside a
  range ("600 to" / "800"), and the card holds across a sub-0.15s gap instead of blinking.
- **A set fills the frame top to bottom.** Walls run to the top edge and floors or tables to
  the bottom edge under the caption card. A wall that starts at y 380 leaves a third of the
  frame as dead space, and dead space is a whole-film ratchet.
- **Things entering a machine pass behind its front face.** Draw order is part of the story:
  stones marching into a hopper that are painted over its front read as floating.
- **A match cut shares exact geometry and a camera at rest.** The finale's ticks land on the
  growth bands of the next shot's stone because both use the same centre, scale and rotation
  (single-sourced through `otolithPoint`), and the outgoing shot returns to zoom 1 with no
  drift before the cut.
- **A label on a prop is type, and a prop drawn after it can hide it.** Round 4's only hard
  blocker was POLLOCK STONES losing its final S behind a hopper that had been moved 70 px to
  fix a different note. The geometry gates model plate against plate and the frame edge, not
  a label against art painted later. When a prop moves, probe every label within its reach.
- **A chip adds to the caption, it never repeats it.** A chip that says what the caption says
  is read twice and doubles the load over the caption band. Give the chip the source, the
  year or the figure instead (LIMITS SET EACH YEAR · PER NOAA under "set by managers").
- **The citation and the film's own read never share a frame.** The sourced comparison
  (CHECKED AGAINST MICROSCOPE AGES · BENSON ET AL. 2023) rides its own line and leaves on the
  frame the film's synthesis (OUR READ) lands, so the read is never captioned by the citation.
- **spring() is for pops and settles, not for travel.** Its ring frequency is fixed per frame,
  so with a long duration it overshot a 900 px slide by 31 percent inside a whip and read as a
  positional pop. Move things with an ease and add a small decaying settle at the end.
- **An entrance is a walk, not a fade.** A figure arriving in a shot starts off frame, its
  stride is driven by the distance it travels so the feet do not skate, it settles with a
  small overshoot, and only then gestures. A fade-in reads as a ghost.
- **A mirrored figure takes its rim from the scene's lamp.** The rig's rim and sheen were drawn
  for a key at the figure's own upper left, so `facing={-1}` put them on the side away from a
  left-hand lamp, where a judge read them as a ghosted duplicate. Since the 2026-10-02 machine
  pass the rig draws ALL its shading in world space (key at the screen's upper left, like every
  prop), so a mirrored figure needs no override; `lightWrap` is only a dimmer for a figure in
  shadow. Judge the cast against the brass on `RigLook` (`npx remotion still src/index.ts
  RigLook out.png --frame=N` from video-engine/) before a rig change reaches a film.
- **Motion the square crop cannot see did not happen on LinkedIn.** The 1:1 cut keeps y 420
  to 1500. A hero move (a bird's flight, a sign's drop) is staged inside that band, and a
  plate that would share the band waits for the move to clear.
- **Clip in the parent's space.** A transform on an element that also carries a clipPath
  transforms the clip with it: a skewed glint escaped its plate for ten frames in every
  round. Put the clip on a parent group and skew the shape inside it.
- **A promised gag is drawn or cut from the board.** A judge reads the board's action line as
  a promise. "The reader fans it with a card" was never drawn, and a disembodied hand would
  have been worse than the promise, so the line was cut and the steam was made legible.
- **A claim and its citation are one plate.** CHECKED AGAINST MICROSCOPE AGES set as three
  boxes of three widths (claim, claim, citation) was flagged by all three judges, the flow
  critic and the editor in the same round. One plate, one width, one left edge: the claim's
  lines over a smaller citation line.
- **A label holds for its own length.** A plate carrying a fact or an attribution is on screen
  at full opacity for at least its characters divided by 15 seconds, and it lands when nothing
  else is landing. The c9 qualifier and the 2023 under NEXT STEP each held about 0.9 s at 22 to
  24 px in round 4, and the editor read them as fine print hiding the honest part.
- **A held gesture still breathes.** A figure pointing for five seconds is a figure frozen for
  five seconds unless breath, a weight shift and a late head turn run under the pose. All three
  judges read the manager on CATCH LIMITS as a still image through 88 to 93 s.
- **The film's own plates use the sourced wording that blocks the wrong reading.** The machine's
  nameplate TRAINED ON THE ARCHIVE was c18's approved string, and it still let the editor read
  the 2.5 million pair archive as the training set once the archive was introduced by that
  number. Where two true figures sit near each other, the plate names the smaller one (archive
  SAMPLES) so the viewer can't merge them.

## 10. Things the 2026-10-03 panel found that were knowable in advance

- **A serif quote plate is wider than a mono one.** Fraunces at weight 900 runs about 0.68 em per
  character in caps, not the 0.56 the first QuotePlate assumed, and five quote plates overflowed
  their borders in round 1. Size a serif plate at 0.68 em plus 90 px, or measure it.
- **An impact must land inside the window it is graded in.** Filmstrips are eight frames centred on
  the beat plus its peak offset. A slam that completes in six frames before the window opens reads
  as a static plate (2 to 3 percent motion). Put the contact about 0.3 s after the beat and keep
  the settle and the object's own jolt running through the window, never a whole-frame shake
  (section 2).
- **A flip that pays a loop is mid-flip on its beat, not finished.** A 24-frame flip that started on
  the beat read as "already flipped" in the sampled window.
- **The lower third of the 9:16 is a stage, not padding.** Below the caption card (y 1475 to 1920)
  every exterior or room shot needs a near plane: a curb and kit bag, a front row of seats, a
  second belt lane, a grass ridge. An empty floor there was named in every round.
- **A light event has to change the room.** A screen-blended shaft over cream paper is invisible.
  Dim everything except the subject (about 40 percent), then draw the shaft opaque with its own
  dust, and keep the slot itself out of the dim.
- **One set and one character carry a contact sheet only so far.** The newsroom wall and the same
  front-on Walter drawing carried nine and five shots; the flow critic counts that. Vary the
  vantage (low angle on the masthead, a close-up on the screen) before adding a set.
- **A 13-second shot that carries two VO lines is two shots.** Split it at the line boundary and
  flip at least two heavy axes, rather than adding motion to one setup.
- **A sequenced plate still needs its own position.** plate_overlap_check reads geometry, not
  timing, and accepts no comment exemptions: give the second plate of a pair a different y.
- **An inset opening over a plate retires the plate first.** A cross-fade under a new inset leaves
  ghosted type for the frames they share.
- **Plates must clear y 490 and stay off y 420 and 1500.** The LinkedIn square crops
  `1080:1080:0:420`, and a push-in moves a plate toward the frame centre, so a plate that sits at
  the crop edge or inside the caption band at rest straddles it mid-push. Put full-bleed rects in
  `data-band="ok"` from the start.
- **A single-outlet story is attributed on screen as well as in the VO.** Put a PER <OUTLET> plate
  on the shot that carries each figure, and never put a proportion beside the count it divides
  (the 1.1 percent only ever pairs with the 119). Draw a proportion to true scale or don't draw it.
- **An outlet's name isn't a cadence.** Say "per the Daily News" once per figure group, not once per
  sentence, or the cadence gate counts the film as a list of attributions.
- **Mix, evidence and caption data come from the board.** Derive sfx kinds, moves and caption splits
  from `storyboard.json` before the first render, and re-run `dispatch_mix.py` after any
  `build_scenes.py` change. Editing sources during a render invalidates its provenance receipt.

## 11. Things the 2026-10-08 panel found that were knowable in advance

- **A beat's descriptive prop is a claim about the record.** "Did DeepGreen call the borough back?" and a desk phone beside MEETING SCHEDULED stated a medium (a phone call) that ADN never reported, and c15's own `requires` said to draw a chair and a calendar. The editor caught it on the first graded cut. Before drawing a prop that carries a relationship (a phone, a letter, a handshake), read the claim's `requires` for the medium.
- **The word "permit" is a claim.** FERC accepted an APPLICATION for a preliminary permit, and no permit has issued. "It's a permit to study" and a plate reading STUDY PERMIT said otherwise. Write APPLICATION FOR, or IF ISSUED, on every surface, VO and post included.
- **A banned phrase in the caption rubric binds the VO and the plates too.** "Disrupt" is on the brand's banned list and ran in the VO, a plate and the post until the editor named it. Grep the VO script, claims on_screen strings and post against `config/brand.yaml` banned phrases BEFORE synth.
- **Two parties' arguments are never drawn with one party's animal.** The fishery's case was drawn over a beluga, which is CBD's claim (c9). Put the fishery's picture on salmon, a boat and permit cards.
- **A plate must be opaque before its line is spoken.** The deadline plate was mid fade-in behind the wall clock when "Filings are due" played, so the film's most important fact was hard to read. Fade in over 6 frames at most and keep the plate above every prop in draw order.
- **A stack that arrives one folder at a time reads as one filer.** Three motions were drawn as one CBD folder first. Bring all of a group in together when the line is plural.
- **Arms leave along the way they came.** `translate(-dist)` in GripHand space moved withdrawing hands THROUGH the handle and parked 120px sleeves across the final frame. A sleeve extends along +x of its hand frame, so retreat is `translate(+dist)` and `dist` must exceed the frame.
- **A lens covers its own sheet.** The yellow ring's bottom edge ran over the sheet header in every pier shot. Set the sheet's top below lens bottom plus the ring width before placing text.
- **Caption cards.** A 180 character sentence has no two-way split under the limit, so the old splitter drew it as one four-row card at phone-unreadable size. `_cards_from_words` now splits recursively, and a card never ends on a number word or a dangling quantity.
- **Held beats under 2 percent change read as a still with a caption.** Boats, empty chairs, a phone, a pencil and the closing lens all measured under 2. Every hold needs one continuous idle cycle (a lamp sway, a boat bob, a lens bob of 3 px, a sleeve breath).

## 12. Things the 2026-10-09 panel found that were knowable in advance

- **A plate in a zoomed shot moves.** A shot that pushes in or pulls back about a point moves a plate authored at y 520 to y 440 or off the frame (the macro cell lost the front of its plate, the pilot plant and NO RESULTS plates went under the corner chip). Any shot whose zoom is over about 1.05 puts its header plates in the Frame `overlay`, which is drawn after the zoom, and the persistent corner chip lives at y 436 to 474, so no plate is authored above y 560.
- **A persistent label is part of the layout.** The PLANNED tag hung above a tank's lid sat behind the open lid ("PLANNEP"), then under a quote plate ("PLAN"), then at x under 0 ("ANNED"). Place a label above the tallest thing in its column, clear of every plate, and inside x 40 to 1040 at the zoom the shot ends on.
- **A rank badge is a result.** Jar badges 1, 3, 2 with the reticle on jar 3 drew the AI's answer for a tool the claims say is only planned. Use question marks and highlight no winner. The same goes for tick marks (an evaluation drawn as done): use empty boxes and a question mark that pops and goes.
- **Say what is planned on the object that is planned.** A solid steel tank beside a PLANNED corner chip still reads as built hardware. The tank carries its own dashed model outline wherever it stands, the governor sits in a dashed PLANNED frame, and the closing frame never shows a result (cells flicker between working and stalled with a 2030? tag).
- **A figure drawn to scale needs its denominator on screen.** The UAF wedge is 913,037 of 5,998,412 (15.2 percent). Label the rest "REST OF THE $6M", never "OTHER AWARDS" (UAF's money comes through a sibling award of the same project, not a different one).
- **The caption box is 1336 to 1472.** A label under a gauge at y 1302 vanished behind it. Check the base of every plate against 1336 after the zoom ends.
- **A pen is long.** Rotating a 150px pen by -24 degrees put its body across the header it was meant to avoid. Rotate it the other way and aim the tip from the side the text is not on.
- **Parallax is the cheapest idle life.** A constant 26 px sine drift on the yard's far layers (FrostYardDusk) lifts every held yard beat above the 1 percent stills the panel keeps naming.
- **Per-run constants cost five cuts.** dispatch_mix.DATE, its riser beat id and BED_ARC, build_evidence.MOVE_RUN_DATE, the run stamp's composition, and the sources.json the build script requires are all hand-set per run, and the mix receipt hashes the board, so any board regeneration needs dispatch_mix.py again before encode. (Machine pass 2026-10-09: the dates now come from `.run_stamp.json` via `scripts/run_stamp.py`, the riser lands on the beat nearest `audio_arc.riser_at`, BED_ARC is `audio_arc.bed` on the board or derived from `audio_arc`, and make_cut.sh runs the mix on every cut. Don't hand-edit any of them.)

## 13. Things the 2026-10-11 panel found that were knowable in advance

- A VO line patch that shortens a line leaves its slot as dead air. Patch to similar length or give the slot a picture event (the steel panel sat empty for 3.3s at 47.4s).
- Spoken and painted words must come from the claims text: "shelf prices", "federal law" and "fixed zones" were inferences the editor caught. Say "tracked in rural Alaska" and "a federal rule".
- Beats anchor to a spoken word, so a re-cut line needs its anchor words re-checked; ids must stay 1..N in time order for dispatch_mix.
- plate_overlap measures the plate `text` width, not displayLines; give overlapping plates distinct y.
- Chips and plates need to be caption scale and clear of wipes; fade plates out before a wipe starts.
- Nickel is the instrument metal, kraft is the tag; do not mix them.
- Held beats need an idle cycle (rotor blades, dotted line, plates under 1 percent change again). Plate now breathes by default.
- No verdict props: the film shows the plan beside the rule and never rules.

## 2026-10-15 additions
- A VO edit after the board exists must be followed by `board_1015.py conform`; since the 2026-10-15 machine pass that conform refuses to write when an anchor word vanished (`scripts/board_anchor.py`), so read its list and re-anchor.
- A typewriter quote card types to the forced-alignment word times, never to a fixed rate, and wraps wide enough that the last line stays inside the card.
- A mix with LRA under 6 gets a deeper VO arc before more bed lift: premix LRA 7.7 delivered 5.5 until the arc depth rose.

## 14. Things the 2026-10-17 gates found that were knowable in advance

- **Read the last two storyboards for MOTIFS, not just tags.** Gate 0B and 0D found the first board repeated 10-15's balance scale that won't tip, folding chairs, a pause and a wall calendar two days later. `storyboard_check` compares the fingerprint axes and passes a film whose objects are the same objects. Before casting, grep the last two boards' `draw.subject` for the props you plan (scale, chairs, calendar, pause) and pick a different prop for the same idea. A growth chart marked in megawatts replaced the scale, a remote replaced the chairs, a date drum replaced the calendar.
- **A fingerprint is a claim about screen time.** Declaring `pov`, `layout` and `motion` for a few shots while most of the runtime sits elsewhere is a relabel. Count the seconds each axis value covers and declare the one that dominates.
- **Declared palette roles bind the kit.** "Cyan is only the fluid" fails the moment a readout paints cyan digits. Grep the kit for the role colours before declaring "only", and recolour the kit, not the plan.
- **A dark label on a dark world is invisible.** `LEVEL 1` set in navy on a navy cutaway disappeared. Give any label that can appear in two worlds a colour prop.
- **A label can sit under a plate.** The ghost block's `100 MW` read as `MW` because a Plate covered its left half. When a held plate sits in the same band as in-scene text, put the in-scene text below the plate's bottom edge.
- **A beat of 0.3 s can't be sampled.** `build_evidence` needs about 0.6 s inside a beat for its strip, so two anchor words a third of a second apart (`reserve`, `Level`) fail the pack after a 13 minute render. Check the board for beats under 0.7 s before rendering.
- **The lower third needs a near plane in every shot.** Interior floors and snow fields were empty under y 1475 in the first frames. A ReserveBar cameo, a rug, a cable and snow drifts in the near plane filled it and gave the throughline object a reason to be on screen in shots it would otherwise miss.
- **`storyboard_check` flags a METRONOME at three gaps within 0.8 s of each other.** Remove a beat or move an anchor word, don't add one.

## 15. Things the 2026-10-18 panel and gates found that were knowable in advance

- **A metaphor object never asserts a claim on its own.** Norm (a jelly that keeps a dent and glows red where the real thing doesn't fit) was drawn pressed against all three projects, and the editor read "work the same way" and the staircase as saying FlowLine and the compressor twin flag departures. Only ANCHOR was described as alerting. Voice the shared idea as "each start from one particular thing", keep the red for the toy boot and for the one mechanism the record describes, and keep the metaphor off any figure (a price tag hangs on its own signpost, never on the hero).
- **Never write he, she or his for a named person the record doesn't gender.** The VO, plates and post said "he" for two named people on a guess. Use the surname ("Smith calls...", "Ronner said").
- **A score is never drawn.** FlowLine "grades" a video and the record gives no score, accuracy or user figure, so three filling grade bars were an invented value. Draw an unvalued chip ("YOUR VIDEO, GRADED").
- **An alert that has not happened is drawn as a design.** The trace leaving the band and a phone that rings must carry a persistent HOW IT'S DESIGNED label and a ghosted phone. A real household's alert has not been reported.
- **A lineage beat that sits next to project tiles links the person to the projects.** The 2019 class and Helena Wisniewski were cut because nothing in the record says she taught these three.
- **A plate is sized for a phone, not for the square sheet.** Judges named 26 to 30 px mono plates as small. Plates in the 9:16 master start at 34 and the sourcing plate at 38.
- **Two plates in sequence still need two different y values.** plate_overlap_check reads geometry, not timing: eighteen overlaps on first run, all sequenced pairs.
- **Beat rhythm is checked in triples.** METRONOME fires on any three consecutive gaps within 0.4 s, and moving one word anchor by a word fixes it. Check the gap list after every VO re-take, because every re-take moves every beat.
- **A shot can only start on a line start, so a 17 s line is two lines.** A 16 s cap forced two script splits (and two re-synths) before the board passed.
- **Do not touch ASSET_MANIFEST.md or ASSET_INDEX.md while a render is bundling.** render provenance hashes them and the encode failed after a 7 minute render. Register the asset before the cut starts.
- **A judge with only Read can't list a folder.** Hand the judges the exact evidence file names (out/evidence listing) in the brief. The first panel round opened no stills and no filmstrips and its Motion axis was a prior, not a measurement.

## 16. Things the 2026-10-20 panel and editor found that were knowable in advance

- **A tally drawn as a closed row of lit lamps reads unanimous.** Five lit vote lamps on a rail that ended inside the frame read 5 of 5, and c8 says never unanimous. Run the rail off both edges with dim housings past the lit ones, and never draw a total.
- **A label that hangs under a cover is clipped by the cover.** The six index tabs started under the folder's front edge, so TENANT read "ENANT" for 70 seconds. Start a tab's text past the cover edge and size the tab for its longest word (SCHEDULE).
- **A stamp lands beside a nameplate, never on it.** SUBPOENA over CROWTHER merged into one unreadable word. Put the stamp on the table front or the paper it acts on.
- **The payoff object never sits on the hero's face or its tab column.** The OCT 26 note covered an eye and three tabs. Seat it low on the cover, clear of the face and the tab stack.
- **A plate carries the hedge the voice carries.** "Developers want site control" and "can be how a state competes" are an ARGUMENT (c17), so the plates say DEVELOPERS WANT and CAN BE. "AIDEA RECEIVES" dropped "proposed", so the plate reads TO AIDEA · PROPOSED.
- **A place label states its distance from the source.** The parcel is about two miles north of Houston, so the label reads HOUSTON · ABOUT 2 MILES SOUTH and sits outside the outline.
- **Every date painted on screen takes the ordinal.** COMMENTS CLOSED AUG 19TH, OCT 14TH, OCT 26TH. A two-word sticky note (OCT / 26TH) fits the paper where one line of 56 px type does not.
- **A plate ladder is planned before the scene is authored.** plate_overlap_check accepts no sequencing, so a scene with four plates needs four y values (single-line, 26 to 32 px, 525 to 750, 60 px apart). A three-line plate at y 575 landed on the folder.
- **TTS respellings and spelled numbers are a caption problem.** "A D L two three four seven six two" and "D N R" reached the screen until `caption_fixups` mapped them (ADL 234762, DNR, 19,950, 495 million dollars). Add the map when the script is written, not after the editor.
- **A board's descriptive sfx name must be one `_BY_NAME` knows.** Unknown names fall to `tick`, so a 49-beat film reached 13 kinds against a floor of 15. Use hit, slide, page, crack, thump, knock, bell, bloop, fade, roll, swell, thunk and clink.
- **A chair that turns to face the hero turns a few degrees.** Thirty degrees read as knocked over, which a muted viewer takes as the witness not showing (c9 is future tense).
- **An aerial backdrop of repeated discs reads as polka dots.** Spruce drawn as one ellipse per clump looked like dots, so the clumps are rings of small star polygons with shadows.

## 17. Things the 2026-10-21 gates and critics found that were knowable in advance

- **A board over about 55 beats can't pass the sfx palette.** dispatch_mix wants distinct kinds equal to 30 percent of the events and the bank has 17, so 65 beats asked for 20 and failed after a 27 s mix. Plan at most 55 beats for a 120 s film, and use sfx names that map to at least 16 distinct bank kinds.
- **Every `<Plate>` carries an explicit numeric `x`.** zoom_clip_check can't measure a plate with no `x={540}` and calls that a failure, not a pass. A plate in a shot that pushes in past about 1.05 must also keep its authored left edge at or beyond 98 px (a push to 1.1 moves it toward the frame centre by 10 percent of its distance).
- **plate_overlap_check accepts no sequencing.** Give every plate in a scene its own y, 70 px apart for single lines and 120 px for two lines, even when each retires before the next lands. Plan the ladder before authoring: nine of sixteen scenes failed it on the first run.
- **Run `build_scenes.py` after every `board conform`.** episode_props.json carries the beats, and a stale one made the first S5 probe show the USGS plate ten seconds early.
- **A must_ship claim's approved string is the plate's string.** c8's TAUGHT FROM PICTURES PEOPLE COLLECT was shortened to PICTURES PEOPLE COLLECT and claims_contract_check failed it.
- **The last beat needs 0.6 s before the VO ends.** A 0.36 s beat on the final word failed build_evidence after a 14 minute render. Anchor the last beat to the word before it.
- **A caption card that ends on "an" or "old" is re-split in vo_script.json before the render**, because captions burn in. Run `caption_render_check.py` against the props before the first full render, not against the cut.
- **A person fading to a ghost outline on a subsistence coast reads as erasure.** The fair worry about fewer people on the beach is drawn as a satellite cell labelling three mounds alike while the middle one breathes unseen, with nobody in frame.
- **The community's decision is never drawn as a count.** Windows lighting one by one read as a vote tally the record can't know. Keep the windows steady before the shot opens, and let Violet's hand hovering and then settling carry the decision.
- **A network picture that converges is a claim.** Dotted guesses that snap onto the human boxes read as a working classifier. They move partway, the needle stays above zero, and the plate says ILLUSTRATIVE.
- **The panel (7.47, 7.24, 7.35, median 7.35) named these on cut 5, all knowable in advance.** (1) A baby walrus carries no tusks, so the calf rig needs a no-tusk setting and a length near 0.4x an adult's. (2) A beat that says "sit" or "settles on the flank" needs the seated pose and a contact frame, because a standing figure and a hand that only hovers read as the beat not landing. (3) A brass tally stopped mid-roll shows half-glyphs ("05 0%") and reads as a typo, so show a clean digit and shiver the housing instead. (4) The shelf's AlaskaMini is a stylised outline, so a pin or a route on it is a guess, and a route map wants the committed true-lon/lat geodata. (5) Four dark data panels in a row (S6 to S9) read as a different deck from the beach, so break the run with a warm beat or give each panel a near plane. (6) Every exterior shot needs a visible near plane in the lower third, and a pool or a map in the middle band with an empty top 40 percent is the weakest frame of the film.

## 18. Things the 2026-10-22 gates, critics and first panel found that were knowable in advance

- **Check the last three films' WORLD before choosing yours, not just their palette tags.** Gate 0B and 0D both called the first board a relabel of 10-20: a faced prop under one lamp on a dark desk with paper sheets sliding in and dashed outlines meaning "missing". Fourteen shots with ten on one table scored 4 of 10 on divergence even though every fingerprint tag differed. Pick the world from the story's own physical fact (here the title, a plumb bob a hair above the ground, so a side view of the ground itself) and let the light arc follow the argument.
- **A metaphor object is labelled on screen from its first second, and it never carries a company attribute.** Plumb is "a reader of maps". With no label the editor and the flow critic both read him as Geomorphic, which made every survey sheet beside him an assertion that the company used it (cut by c6 and c7). Never hang a company tag (KEEPS AN INTEREST) on its string, never put it inside the company's dashed ground ring, and float data sheets away from it instead of under it.
- **"One of those surveys" after "its data includes new state surveys" says the company reads that survey.** Write "what one of those surveys looks like". The same goes for the plate and the first still of the shot.
- **A spelled TTS token reaches the screen unless `caption_fixups` maps it.** "C E O" shipped on a caption in the first cut while "A I" was mapped. Map every initialism the script spells (C E O, A I driven to AI-driven) when the script is written.
- **A HangTag on a hero that travels past x 700 or under x 380 takes `atX` and `camScale`.** The metaphor tag on Plumb read METAPHO and METAP on shots 3, 5, 9 and 10 with the hero at x 850 to 910. Pass the knot's authored frame x and the shot's camera scale and the body slides inside the 54 px safe margin while the knot stays put (`tagShift` in lib/prospect.tsx, tested by tests/hangtag_clamp.ts).
- **A hovering or trembling hero is read as a camera jolt.** jolt_check registers consecutive frames and counted four jolts in the last 25 seconds, all from `tremble` jitter at about 1.9 rad per frame on a 170 px bob. Keep a hero tremble under 0.4 rad per frame and 2 px.
- **Plan the claim count before writing the VO.** vo_claims_check wants 7 claims a minute, so a 114 to 120 s film needs 14 to 16 distinct cited claims and the first draft cited 11. Split compound facts into atomic claims that are really spoken (Portland-based, airborne, the instruments) instead of padding the script.
- **A film that spells numbers adds them once.** The hook counted 45,800 on screen at 7 s and the globe at 58 s paid the same sum again. Keep the sum on the plate in the hook and let the globe be the physical comparison (more than once around), with the plate saying SURVEYS ADD, NOT ONE FLIGHT.
- **Globe geography is checked by a viewer.** Alaska and Peru on one blob of land read as wrong. Draw the Americas (a broad north, a waist, a long south with the west coast bulge) and pin Alaska on the north-west corner and Peru on the south's west coast.
- **A shot that ends on the last word of the VO needs 0.6 s inside its beat.** build_evidence refused a beat anchored on the final word after a 15 minute render. Anchor the payoff on the word before it and give the picture a tail (`tail_s`) so the one hard image holds for three seconds.
- **A caption card must not break after "line" or "most".** caption_split_after in vo_script.json, or reword. The first card of the film read "...about 45,800 line" for the whole first second.
- **Dead sky is a composition defect in a vertical frame.** The first ground world put the top 35 percent of the frame as flat gradient. Birds on two speeds, a low sun glow and cloud bands cost nothing and fill it. Strata need cracks and stones, and glow needs a soft falloff clipped to the bands, not hard translucent discs.
- **Tooling:** never `pkill -f` a name that appears in your own command line (the shell kills itself, exit 144). Scan /proc for the PIDs and exclude your own.
- **Every reviewer reads a label that a character or a camera move covers.** The 10-23 film lost four cuts to one defect class: Dotty standing over the BOROUGH LAND sign or the end of a hanging tag, a quote card over the FAA plate leaving "AA", a card wider than the frame after a push-in, a corner tag cropped mid-dive. Before the first cut, list every label in a shot and check it against the character's footprint and the camera's visible span at its highest zoom. If a label has no job in a shot, don't draw it there. `scripts/label_footprint_check.py` now measures this in Chrome before every cut (machine pass 2026-10-23).
- **A date stamped on a prop under a plate is a stray glyph.** The stamped OCT 20TH on the card sat behind the IN EFFECT bar and left a lone "0" for five seconds. Fade the prop text out when the plate that repeats it lands.
- **Don't label a gauge twice.** RainGauge draws its own 1 IN scale when labels is true, and the ruler beside it drew another, with the vane pole crossing one. Pass labels={false} when a ruler is on screen.

## 19. Things the 2026-10-24 gates, critics and first panel found that were knowable in advance

- **A running countdown is a deadline.** The 72 hour ring drained from 72 toward 43 beside crew dots and the editor read a containment deadline, which c6 forbids (72 hours is a CONDITION for attacking). Draw a condition as a static gauge with a threshold mark and a yes or no test, never a ticking number.
- **A mono string needs its plate before the render, and a colon in a clock label is a copy-rule fail.** `72:00` failed visible_copy_check in the beat label and on screen. Write `72 HR`. Check the board annotations, not just the painted text.
- **A claim's approved `on_screen` string must appear in the source as ONE literal.** c8, c10 and c19 failed claims_contract_check because the film painted the words as split plate lines. Set the claim's on_screen to the string the plate's `text` prop carries.
- **A conditional string in a plate is measured as both branches joined.** `text={f < t ? 'A' : 'B'}` failed zoom_clip at 1290 px. Use two plates at two different y values and fade one.
- **A ruler or column that runs under y 1336 loses its last label behind the caption.** The 4 FT tick and the column bases were clipped. Build any cut so its last label ends above 1300 (a 540 px column from y 760 ends at 1300 and carries 0 to 3 FT).
- **A dashed guide line through a ruler label covers it.** The one-foot line crossed `1 FT`. End the line segments 40 px short of the label.
- **A flat navy plate reads as dead space on every shot that uses it.** Tiles at 10 to 30 percent opacity were invisible, so the panel called the top 430 and bottom 500 px empty. The orbital plate carries tiles at 22 to 60 percent, contour rings and two shaded ridges, and the lower third needs a near plane.
- **Zooming into a flat gradient square is not a transition.** The fall-through frame was the weakest in the film (3.5 of 10). Stop the zoom near 4.5x and carry the fall in a mosaic of thermal tiles that the next shot dissolves out of, over about 1.5 s, not 0.5 s.
- **Bracket corners and flag notches cover letters.** CHICKEN FIRE lost its last letter under a bracket and DETECTED its D under a notch. Put a tag outside any bracket box and size a flag to its string plus 40 px.
- **An unnamed source gets no pronoun.** The VO said "she" for the Northern Arizona University scientist and the record doesn't gender them. Use "that doubt" and "it".
- **Never tie Alexander's ground to Fort Yukon, and never light a planned burn.** The CATG plan is dashed and ghosted in every glyph (the corner flame twin too), the FORT YUKON label arrives only on the plan, and the film ends on a dashed square labelled PLANNED, NOT YET LIT.
- **Two grids compare only in the same unit.** Fifty puffs against four coins was two units. Draw both as 100 slots with the filled ones from the bottom row.
- **LRA 5.9 means the bed isn't moving.** Author `audio_arc.bed` with a deep pocket under the doubt (0.14), a swell into "Deciding" and into the three roads (1.05 to 1.15) rather than relying on the derived arc.
- **The sandbox's Playwright revision moves.** remotion.config.ts now falls back to whatever chromium_headless_shell is installed under /opt/pw-browsers.
- **A hook needs an event, not only a pixel.** A square snapping on at frame 6 scored 6.5 on the hook. Add a blast ring, a one frame flash and a larger overshoot on the ignition.

## 20. Things the 2026-10-25 gates, critics and panel found that were knowable in advance

- **A recommendation is never drawn as an act.** The first board stamped ALL ZONES across the map, dropped a board on two signposts and called it "overrode both". The editor and Gate 0B read all three as enacted law. Draw RECOMMENDED with dashed hatching, carry a dashed board past the posts, and write "recommended a ban instead". A proposed number (Fairbanks 5 MW) is a dashed tick with a PROPOSED flag and the word "proposed" in the VO.
- **A faced metaphor object reacts to SIZE, never to policy.** The Plate flinched at the ban and leaned hopeful on the permit post, and Gate 0B ruled it was voting. Its face may strain, crack and look along a ruler. It never smiles at a side.
- **Cameo characters stand above y 1318.** The caption bar starts at 1336, so a figure authored at y 1390 or 1420 shows only its head. Judges named it in round 1 and again on the first cut.
- **plate_overlap_check wants a unique y per plate per scene, even when plates retire in turn.** Fourteen overlaps on the first run, all sequenced pairs. Plan the ladder (560, 640, 720, 800 for single lines, 700 for a two-line plate) before authoring.
- **In-scene text under a transform trips text_fit.** `translate(540,920) rotate(-8)` with `x={0}` was measured at absolute x 0. Put the absolute x on the text and rotate the element about its own centre.
- **label_footprint flags labels outside the camera span.** A camera that drifts to fx 640 at z 1.04 cuts a label at x 0. Keep drifting cameras symmetric about x 540, and show a cart's own label only while the cart is wholly in frame.
- **A sign with a face has the face above the lettering.** The mouth at the lettering line read as a strike through DATA CENTER in every judge's notes (fixed by moving the eyes and mouth up 24 px).
- **A hand-cart for anything that moves along the boardwalk.** "Is carried" with no carrier is an implied off-screen person.
- **The 38-towers picture needs a skyline, not a ribbon.** A single stack of 38 at the end of a crane is one pixel wide. Seven columns by six levels read as a count and as a place.
- **The credits card is flat by design.** ship_gate's blank-frame sampler landed on its first frame and blocked a film every judge had passed. The sampler now measures the story only (fixed this run).
- **Held shots 10 to 11 measured 2 to 6 percent change for 20 seconds in every round.** Rain and a camera push do not count. Give each held beat an object with its own motion (water drops into the pans, a gull shifting, a card tilting).

## 21. Things the 2026-10-26 gates, critics and panel found that were knowable in advance

- **A map is a recognisable map or it is not drawn.** The first Alaska was a tan blob and three judges named it the weakest frame (authenticity, craft and a held-slide motion read at once). Use a real outline (Ep1026 `AK_PATH`, a 1000 by 720 silhouette with the Aleutian tail and the panhandle), put the two places on it at their true relative positions, and keep both labels off the route.
- **A camera that pans beyond the canvas shows the frame's ink background.** `track()` now clamps fx and fy to the visible span (540 over z, 960 over z); never author z under 1.0 either, because the clamp can't fix a zoom-out.
- **A plate in a shot with a moving camera sits over different art than you authored.** Plates are in the overlay, art is zoomed, so a label authored at y 820 sat at 836 on screen. Probe a frame at the end of the push before placing a plate stack.
- **A pen, a tick or a coin crossing a label is a label_footprint FAIL.** Draw the tick above the YES text, keep the pen outside the slip, and put a hanging tag on its own line clear of the cord that hangs from it.
- **A moratorium is a padlocked gate with a keyhole and a key (STUDY, a dashed FRAMEWORK), never a wall or a BAN plate**, and the key plate says NOT PASSED YET, never NOT WRITTEN YET when the same film shows a bill that passed one chamber.
- **A hypothetical is drawn dashed.** Moore said data centers "could" pay a dividend, so the coins are outlines hovering over the slots, they start at the envelope and never pass the TAX register, and the plate says COULD PAY.
- **A neutral faced hero stays out of beats that look like a side.** The BallotBox beside only the yes lecterns read as a verdict; it now appears only for the slip and the grid, never beside a candidate.
- **A lamp that says ALERT is amber.** A green lamp under RECENT ENERGY ALERT read as all clear. Green means electricity only, so the warning lamp is amber and the line stays green.
- **A name on a plate follows the name in the VO**, and a label for one candidate never sits under another's plate (ZONING IS LOCAL belongs to PRAX · HANEY and carries their names).
- **Text inside a flip transform clips.** The bill sheet's headings and stamp were cut by the scaleX of the flip; size them for the narrowest frame of the flip.
- **The mix needs a moving bed.** LRA 5.7 became 7.0 when the bed alternated between 0.12 and 1.0 across lines instead of sitting at 0.5 to 0.8.
- **Floors and walls that run under the caption band take `data-band="ok"` on the element itself**, not on a parent group.
- **ship_gate record takes the judges' NUMERIC scores** (`--judges 7.17,7.23,7.01`), and `upload_video.py` without `--name` writes a plain `dispatch_master.mp4`; always pass `--name dispatch-<date>-<basename>`.
- **Never build a thesis on "the source reports no X" before fetching the source table.** Run 2026-10-28 almost shipped a film saying the preprint had no held-out Alaska number; Table 7 had four.
- **Keep the agency's instrument faceless and fully lit, and label the faced model fan THE MODEL.** Nothing a model does may be drawn on the agency's sonar, and the last frame carries the same labels as the first.
- **A VO sentence edit moves beat gaps.** Re-run storyboard_check after every VO change; max_gap (5.0 s) and the metronome band (0.4 s) trip on a single added sentence.
- **Say who a figure belongs to.** A practitioners' rough figure placed next to an agency's numbers reads as the agency's. Attribute it in the same sentence and say what it is not.

## 9. Things the 2026-10-29 build and panel found that were knowable in advance ("The Reactor Is Still a Dotted Line")

- **A plate paired by text_fit is the rect drawn immediately before the text.** A component of loose `<text>` in local coordinates fails text_fit against whatever rect came first (a header bar), so draw text through a measured `Lab` (rect sized by `monoW`, text centered on it). Define shared components above S1: zoom_clip and text_fit attribute every element to the scene function it sits inside.
- **Sequenced plates in one slot need `{/* plate-overlap-ok */}` on the line**, and a plate in a shot with a camera move is not where you authored it (plates are screen space, art is zoomed). Keep camera zoom at or under 1.1 where a plate sits above art, or probe a frame.
- **Stamps, chips and tags that cover a ruled line are a label_footprint FAIL.** Staple condition blocks to the outside of the tag, not over its own NOT STATED stamps.
- **Red is for one thing.** A red bush plane in front of a rose horizon cost a Gate 0D blocker. Plane cream, crossings ink, one stamp color.
- **A caption card with a 38 character figure phrase can't break clean in 37.** "about 14.5% under the $10.82 reference price" dangles on every cut. Write the spoken figure so the phrase fits a row ("below the reference price of ten eighty two"), before synth.
- **A VO sentence change moves everything.** Re-synth, re-run board gen, beat_gaps and `build_evidence --check-plan` before a render; a beat shorter than 0.6 s can't carry its motion strip.
- **The sfx schedule wants 15 distinct kinds.** Names not in `scripts/sfx_names.py` (`slam`, `whir`, `klaxon`) don't count; use `stamp`, `whirr`, `alarm`.
- **Don't claim the cause.** "A discount is what an early blank costs" read as AIDEA's statement and had no source. State the fact of the deal (the shares come at a discount) and let the reader link it.
- **Tense follows the claim.** Say agreed to buy and agreed to pay while the merger hasn't closed, in the VO, the plates and the caption.
- **Empty frame bands are a Composition cap in the 9:16 master.** The top 400 px and the bottom 500 px sit outside the square, so give them a moon, clouds, a shelf, floor props, or a full-bleed map instead of flat fill.

## 22. Things the 2026-10-31 gates, critics and panel found that were knowable in advance ("A Ceiling Is Not a Cable")

- **Two days after a film about the same agency, check the PROPS, not only the palette.** All three Gate 0 critics failed the first board because a jar marked $75M, a wall calendar and a dashed outline of the unbuilt thing were 10-29's props with new paint. Pick the picture from this story's own world (a tide gauge at zero, a closed chronometer, an unfinished pencil line on a chart) and write an honest-overlaps line in the divergence note.
- **A throughline object that never acts in a shot is not in the shot.** The first board said Pip travelled in every shot and staged it in five. Give the object one decided action per shot or cut it from that shot, and stage every engraving state the plan names.
- **A repeated weighing gesture on one prop is a sag.** The first scale block was three shots and six weighings in 31 s. Put the absence gag on a different surface, label the pans, and give each weight its own beat that visibly moves the needle.
- **A hook line that is an absolute claim is a blocker.** "Anything you send out of Alaska leaves on a cable" was unsourced and overbroad (satellite). Open on a question or on a sourced, attributed line.
- **A landing rule, a count and an extension clause each come from a named document.** The capacity rule is in the release, the studies are "cited", "past typical design life" is AIDEA's figure, and an authority that ends "unless the board extends it" says so in the VO as well as on the plate.
- **Plates in the lower third hide under the caption card (y 1336 to 1472).** Pan labels, keyholes, a postcard and a road all landed there. Stage the shot's subject above y 1300 and check the pan labels sit under the pans only if the scale is raised clear.
- **A full-bleed sea is a colour decision, not a window.** Cobalt over 45 percent of a frame read as default blue and as 10-24's orbit. Inset the sea in paper, keep it green-teal, and cap its area.
- **The top third of a 9:16 frame needs a motivated layer.** Four judges named dead cream above the action. `ChartBG` now carries a top rail with hanging pennants and a lamp cone, and hero art starts higher.
- **A recording that includes a card with the agency's name on a cable line implies ownership.** Name cables by system and owner, and keep the agency's attribution on a plate, not on the cable.
- **Plate overlap and label footprint are measured in screen space after the camera.** A plate authored clear of a sign at zoom 1.0 sat on it at 1.2. Probe a frame mid-push before placing a plate stack, and give each plate its own y.
- **Run label_footprint after moving any prop, not only at the cut.** Seven of the nine source-gate stops this run were a label under a magnifier handle, a pencil, a postcard or a plate.
