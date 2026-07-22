# Caption Craft — the variety engine for post copy

The caption is a bespoke piece of writing, conceived fresh per run, not a
template filled with today's nouns. This doc is the craft library the caption
room draws from and the laws the caption-critic enforces. The ledger at
`ledger/captions.json` is the memory that makes repetition impossible.

## The anti-template law (the whole point)

If today's caption could be produced by swapping the nouns into yesterday's
caption, it fails. The shape itself must be a choice. Every run the room picks
a named OPENING MOVE, a STRUCTURE, and a CLOSING MOVE, and the recent ledger
entries are excluded from the menu. Form serves the story: pick the move the
material actually rewards, never a gimmick for variety's own sake. Same-y and
safe loses to specific and alive, but clarity beats cleverness when they fight.

## Banned furniture (mechanically enforced, caption_check fails these)

Recurring connective tissue that made the old captions read like a mail merge.
Never write:
- "The deck walks through..." / "walks you through" / any "N slides walk" line
- "These 9 slides..." or any slide-count-does-X sentence used as furniture
- A closing question bolted on in the same breath every day

Pointing at the deck is allowed, but earn it fresh each time or skip it: fold
the pointer into the argument ("Slide 6 is the one the council member will
bring to the meeting"), make it a dare ("The deed map alone is worth the
swipe"), or let the deck sell itself with no pointer at all.

## Opening moves (pick one; last 6 runs' moves are off the menu)

- COLD NUMBER — one verified figure, alone, before any context. "31 square
  miles. Zero dollars."
- SCENE — put the reader somewhere physical at a time. Freeze-up, a dock, a
  hearing room at 5 p.m.
- CONTRADICTION — two true things that cannot both be comfortable, side by
  side.
- QUOTE FIRST — a verified human sentence opens, attribution after.
- SECOND PERSON STAKE — what this decision does to the reader's bill, land,
  or job. Use sparingly and only when literally true.
- TIMELINE COLLAPSE — then vs now in two beats. "In 1979 there were 1,300.
  Today, 331."
- DEFINITION SUBVERSION — take a word everyone uses and show what it actually
  means here.
- THE ABSURD DETAIL — the one small verified fact that sounds made up and is
  not.
- LEDGER TALLY — a running count or scoreboard framing, receipts up front.
- QUESTION FIRST — open on the genuine question the story turns on. Not
  clickbait, the real fork.
- LETTER FRAME — addressed to a named decision-maker or body, respectful and
  blunt.
- MAP MOVE — geography does the arguing. Name the places, walk the line.

The menu is not closed. A director may invent a move and name it NEW:<name>;
the critic judges it, and if it ships it joins this list.

## Structures (pick one; last 3 runs' structures are off the menu)

- INVERTED PYRAMID — hardest fact first, context widening beneath it.
- BRAID — two threads alternating (the deal and the person fighting it),
  meeting in the last line.
- COUNTDOWN — organized around a real deadline, time pressure explicit.
- PUNCH THEN PROOF — one-sentence claim, then the receipts, one per line.
- Q AND A — the story as the three questions an owner would actually ask,
  answered straight.
- ZOOM — one household or block, then the borough, then the state. Or the
  reverse.
- COLD OPEN, WARM CLOSE — data-forward top, human consequence last.

## Closing moves (rotate; never the same phrasing two runs straight)

The close is still a real, debatable question (caption_check requires it),
but the KIND of question rotates: a fork ("fair trade or giveaway?"), a
stake ("would you take that deal for your block?"), a prediction ("what
lands first, the tenants or the lawsuits?"), a who-decides ("should the
neighbors get a vote before the deed moves?"), a price ("what is the honest
number?").

## Voice, unchanged and non-negotiable

Everything in config/brand.yaml still binds: analytical, position-taking,
plain English, grade 8-10. No em or en dashes, NO COLONS EVER (clock times
excepted), no semicolons, straight quotes, no emojis, exactly 3 niche
hashtags as the final line, hook under 140 chars, 300-900 chars total, no
links, no sources, no credits, no AI-tells, close on a real question. The
variety engine changes the shape, never the standards.

## The ledger contract

After every shipped run the showrunner appends to `ledger/captions.json`:
run_date, opening_move, structure, closing_move, first_words (the caption's
first 8 words), and hook_type. Before writing, the room reads the ledger and
excludes: opening_move used in the last 6 entries, structure in the last 3,
closing phrasing in the last 1. caption_check additionally hard-fails any
caption whose first 4 words match any of the last 12 entries.
