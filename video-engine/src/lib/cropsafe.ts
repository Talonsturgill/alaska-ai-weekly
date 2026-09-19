/**
 * THE SQUARE CROP IS AN AUTHORING CONSTRAINT, NOT A POST STEP.
 *
 * WHY THIS EXISTS (2026-09-19, the run that shipped the Cordova powerhouse episode).
 *
 * The canvas is 1080x1920. The deliverable that actually lands in the LinkedIn main
 * feed is `crop=1080:1080:0:420` off that canvas, so the audience for the primary cut
 * sees master y 420..1500 and nothing else. Five separate defects in one episode all
 * came from authoring in canvas coordinates and checking in canvas coordinates:
 *
 *   - the rack's GREENSPARC nameplate sat at 1449..1514 and the square showed the top
 *     half of the word, cut off by the frame edge
 *   - the 170 kW source plate (the film's central number) sat at 1470..1530, so the
 *     square showed a sliver and then nothing
 *   - PHASE 1 . STARTS OCT 1 sat at 1469..1530, sliced in half
 *   - a four-line list ending INTENDED, NOT MEASURED sat at 1560..1756, so the cut that
 *     ships held a still frame for four seconds while the 9:16 built a list
 *   - the forecast chart's OBSERVED / CLAIMED axis labels sat at 1700, so the primary
 *     cut carried an unlabelled chart
 *
 * NONE of that was caught. `crop_safety.py` samples the two boundary rows of the
 * rendered master and reports structure crossing them, and its own docstring says why
 * it cannot be the authority: at a boundary row a plate's border and the room's
 * wall-tile seam are the same measurement, because the difference is not in the pixels,
 * it is in whether the element was AUTHORED. It ends by naming the fix: "The
 * authoritative check is the build-time invariant in the episode, which throws because
 * it knows which elements were authored and this does not."
 *
 * This is that invariant, lifted out of one episode so every future one inherits it.
 *
 * WHAT IT PROMISES, EXACTLY:
 *   - An authored element may live INSIDE the square band. Always fine.
 *   - An authored element may live entirely BELOW the square band. That is a legitimate
 *     9:16-only flourish, so this returns a report line instead of throwing; the run
 *     reads the report and decides whether the primary cut is being starved.
 *   - An authored element may NOT STRADDLE a crop line. There is no composition in
 *     which a headline cut in half at the frame edge is the intent, so that throws and
 *     the render fails loudly, before a single frame is encoded.
 *
 * WHAT IT DOES NOT PROMISE. It checks AUTHORED coordinates. A per-shot camera move can
 * translate and scale the whole picture, so an element that clears the line on paper can
 * still drift across it on screen. That residue is what `crop_safety.py` is for: it
 * samples the real pixels. The two checks are complementary and neither replaces the
 * other. Do not read a pass here as "the square is safe"; read it as "nothing was
 * authored across the line".
 */

export const CANVAS_H = 1920;
export const SQUARE_TOP = 420;
export const SQUARE_BOT = 1500;

/** The burned caption bar's band in canvas coordinates. Anything authored here is
 *  behind the captions in BOTH cuts, which is its own kind of invisible. */
export const CAPTION_TOP = 1330;
export const CAPTION_BOT = 1475;

export type CropNote = {
  label: string;
  top: number;
  bottom: number;
  kind: 'below-square' | 'behind-captions';
};

const notes: CropNote[] = [];

/** Everything this render authored outside the square band, for the run to read. */
export const cropNotes = (): CropNote[] => notes.slice();
export const resetCropNotes = () => {
  notes.length = 0;
};

const seen = new Set<string>();

/**
 * Assert one authored element's vertical span against the square crop.
 *
 * @param label  what the element is, as it should read in the error (its own text)
 * @param top    authored top edge, canvas y
 * @param bottom authored bottom edge, canvas y
 */
export function assertCropSafe(label: string, top: number, bottom: number): void {
  const crosses = (line: number) => top < line && bottom > line;

  if (crosses(SQUARE_TOP) || crosses(SQUARE_BOT)) {
    const line = crosses(SQUARE_TOP) ? SQUARE_TOP : SQUARE_BOT;
    throw new Error(
      `CROP-UNSAFE: "${label}" is authored at y ${Math.round(top)}..${Math.round(bottom)}, ` +
        `across the square crop line at y=${line}. The LinkedIn cut is ` +
        `crop=1080:1080:0:${SQUARE_TOP} off this canvas, so that element ships cut in half. ` +
        `Move it wholly inside ${SQUARE_TOP}..${SQUARE_BOT}, or wholly outside if it is ` +
        `meant as a 9:16-only flourish. See video-engine/src/lib/cropsafe.ts.`,
    );
  }

  // Not a failure, but the run should know what the primary cut never shows.
  let kind: CropNote['kind'] | null = null;
  if (top >= SQUARE_BOT) kind = 'below-square';
  else if (bottom > CAPTION_TOP && top < CAPTION_BOT) kind = 'behind-captions';
  if (kind && !seen.has(label + kind)) {
    seen.add(label + kind);
    notes.push({label, top: Math.round(top), bottom: Math.round(bottom), kind});
  }
}
