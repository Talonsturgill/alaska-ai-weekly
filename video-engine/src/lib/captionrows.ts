// CAPTION ROWS BY SENSE: the one row breaker every episode shares (machine pass 2026-10-03).
//
// Until this file, each episode carried its own copy of captionRows and its own DANGLE list,
// and every run re-learned the same breaks: "caught in the / Aleutians", "600 to" / "800
// percent", a card that blinked off for one frame between cues (07-31, 08-02, 08-04, 08-09,
// 08-13, 09-19, 10-02, 10-03). The rules are written once here, in plain TS with no React, so
// scripts/caption_render_check.py can run the SAME function over a run's cues in node and fail
// a row that ends on a word pointing forward at what has not arrived yet.
//
// Import it (or the CaptionBar in ./captions) in a new episode. Never copy it in.

/** Words a row must not end on: articles, prepositions, conjunctions, determiners, auxiliaries
 *  and the number words that need the unit after them. A possessive ('s) is caught by rule. */
export const DANGLE = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'nor', 'of', 'to', 'in', 'on', 'at', 'for', 'from', 'with', 'by',
  'as', 'that', 'than', 'if', 'its', 'his', 'her', 'their', 'our', 'your', 'my', 'this', 'these', 'those',
  'is', 'was', 'are', 'were', 'be', 'been', 'has', 'have', 'had', 'will', 'would', 'can', 'could', 'it',
  'not', 'no', 'into', 'onto', 'about', 'over', 'under', 'each', 'every', 'more', 'most', 'less', 'only',
  'next', 'very', 'so', 'what', 'where', 'when', 'who', 'which', 'whose', 'how', 'why', 'tiny', 'old',
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'hundred', 'thousand',
  'million', 'billion', 'per', 'like', "it's",
]);
const PREP = new Set(['in', 'on', 'at', 'into', 'onto', 'from', 'with', 'by', 'under', 'over', 'as', 'like', 'to', 'for', 'of']);
const WH = new Set(['where', 'what', 'when', 'who', 'which', 'how', 'why', 'if', 'because', 'while', 'whether']);
const POSS = new Set(['its', 'their', 'his', 'her', 'our', 'your', 'my']);
// A pronoun plus "is" ("that's six hundred") is a clause, not a possessive, and reads fine at
// a row end. "it's" stays a dangle through DANGLE above, as the 10-03 film had it.
const CONTRACTED = new Set(["that's", "what's", "there's", "here's", "who's", "he's", "she's", "let's", "where's"]);
const bare = (w: string) => w.toLowerCase().replace(/^["'(]+/, '').replace(/[,.;:?!)"']+$/, '');
const isNum = (w: string) => /^[$]?[\d.,]+%?$/.test(w);

/** Why a row (or a whole card) ends on a dangling word, or null when it ends cleanly. A row
 *  that ends in punctuation is closed, whatever the word. */
export const danglingEnd = (row: string): string | null => {
  const w = row.trim().split(/\s+/);
  const last = w[w.length - 1] || '';
  if (!last || /[,.;:?!]["')]*$/.test(last)) return null;
  const b = bare(last);
  if (isNum(last)) return `a figure "${last}" parted from its unit`;
  if (DANGLE.has(b)) return `"${last}" points at a word on the next row`;
  if (/'s$/.test(b) && !CONTRACTED.has(b)) return `the possessive "${last}" is parted from what it owns`;
  return null;
};

/** Rows split by sense. Among every way to set the text in one to three rows of at most `max`
 *  characters, the breaker takes, in order: the fewest rows that end on a dangling word, then the
 *  fewest rows, then the best soft cost (balanced rows, a break at a comma or clause or before a
 *  preposition or wh-word, never a verb parted from its object at a possessive). So a clean two-row
 *  split is always preferred, and when every two-row split dangles ("caught in the" / "Aleutians")
 *  it goes to three clean rows rather than ship the dangle. Greedy rows only when nothing fits. */
export const captionRows = (text: string, max = 37): string[] => {
  if (text.length <= max) return [text];
  const w = text.split(' ');
  const n = w.length;
  type Pick = {rows: string[]; key: [number, number, number]};
  let best: Pick | null = null;
  const better = (a: Pick['key'], b: Pick['key']) =>
    a[0] !== b[0] ? a[0] < b[0] : a[1] !== b[1] ? a[1] < b[1] : a[2] < b[2];
  const score = (cuts: number[]) => {
    const bounds = [0, ...cuts, n];
    const rows = bounds.slice(1).map((e, i) => w.slice(bounds[i], e).join(' '));
    if (rows.some((r) => r.length > max)) return;
    const L = (text.length - (rows.length - 1)) / rows.length;
    let dangles = 0, soft = 0;
    rows.forEach((r) => { soft += Math.abs(r.length - L); });
    for (const k of cuts) {
      const prev = w[k - 1], next = bare(w[k]);
      if (danglingEnd(w.slice(0, k).join(' '))) dangles += isNum(prev) ? 2 : 1;
      if (isNum(w[k]) && ['to', 'and', 'or', 'of'].includes(bare(prev))) dangles += 2;
      if (/[,;:.?]$/.test(prev)) soft -= 30;
      if (PREP.has(next) || WH.has(next)) soft -= 15;
      if (POSS.has(next)) soft += 12;
    }
    const pick: Pick = {rows, key: [dangles, rows.length, soft]};
    if (!best || better(pick.key, best.key)) best = pick;
  };
  for (let a = 1; a < n; a++) {
    score([a]);
    for (let b = a + 1; b < n; b++) score([a, b]);
  }
  if (best) return (best as Pick).rows;
  const rows: string[] = [];
  let row = '';
  for (const x of w) {
    if ((row + ' ' + x).trim().length > max && row) { rows.push(row); row = x; } else row = (row + ' ' + x).trim();
  }
  if (row) rows.push(row);
  return rows;
};

export type Cue = {t: number; d: number; text: string};

/** The cue on screen at time t (seconds). A card HOLDS across a gap under 0.15 s to the next
 *  cue, so it never blinks off for a frame between two lines. */
export const activeCue = (cues: Cue[], t: number, hold = 0.15): Cue | undefined =>
  cues.find((x, i) => {
    const nx = cues[i + 1];
    const end = nx && nx.t - (x.t + x.d) < hold ? nx.t : x.t + x.d;
    return t >= x.t && t < end;
  });
