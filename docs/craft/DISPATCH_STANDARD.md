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
