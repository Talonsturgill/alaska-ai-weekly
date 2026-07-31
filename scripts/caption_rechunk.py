#!/usr/bin/env python3
"""RE-BREAK CAPTION CUES ON PHRASES, IN PLACE, WITHOUT RE-ALIGNING ANYTHING.

WHY THIS EXISTS (2026-07-31, panel round 10).

Judge 3: "the caption chunker orphans nearly every sense unit -- 'Alaska has a patchwork,
not a', 'New York's covers only the biggest', 'His has no size limit and', 'comes from, not
on whether the'." Roughly two thirds of cues ended mid-phrase. The cause was in
dispatch_captions.py, which filled a cue to a character budget and then cut wherever the cut
landed, and that is fixed there for every future run.

This run cannot simply re-run that script: it force-aligns from per-line wavs that this
run's surgical VO patch consumed, and out/dispatch/audio/words.json predates the patch. Re-
deriving the alignment to fix a display-only defect would risk the thing that is currently
correct (sync) to improve the thing that is currently wrong (line breaks).

So this tool does the smallest correct thing. It never re-times a word and never changes a
single character of caption text. It only moves DANGLING TRAILING WORDS from the end of one
cue to the head of the next, within the same VO line, and moves the boundary timestamp with
them, allocating the moved time proportionally to the characters moved. A word is dangling
if it cannot end a phrase: an article, preposition, conjunction, auxiliary or possessive.

The guarantees, asserted at the end:
  - the concatenated text of all cues is byte-identical before and after
  - cue starts remain monotonic and no cue overlaps its neighbour
  - no cue is left shorter than MIN_DWELL

  python3 scripts/caption_rechunk.py [--in out/dispatch/captions.json]
"""
import argparse, json, os, re

DANGLING = {
    "a", "an", "the", "and", "or", "but", "of", "to", "in", "on", "at", "for", "from",
    "with", "by", "as", "that", "than", "if", "so", "since", "while", "not", "no",
    "is", "was", "are", "were", "it", "its", "his", "her", "their", "this", "these",
    "what", "when", "where", "who", "one", "up", "into", "onto", "about", "over",
}
MIN_DWELL = 0.42          # a cue this short is a flash, not a caption
MIN_KEEP_WORDS = 2        # never strip a cue down past this


def dangling(word: str) -> bool:
    w = re.sub(r"^[\"'(\[]+|[\"')\]]+$", "", word).lower()
    if re.search(r"[.!?,;:]$", w):     # punctuation ends a phrase, so it is never dangling
        return False
    return w in DANGLING


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="src", default="out/dispatch/captions.json")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    raw = json.load(open(a.src))
    cues = raw["cues"] if isinstance(raw, dict) and "cues" in raw else raw
    before_text = " ".join(c["text"] for c in cues)

    moved = 0
    for i in range(len(cues) - 1):
        cur, nxt = cues[i], cues[i + 1]
        if cur.get("seg") != nxt.get("seg"):
            continue                       # never move a word across a spoken line
        words = cur["text"].split()
        tail = []
        while len(words) > MIN_KEEP_WORDS and dangling(words[-1]):
            tail.insert(0, words.pop())
        if not tail:
            continue

        span = cur["end"] - cur["start"]
        if span <= 0:
            continue
        # allocate the boundary by characters, which is the best proxy available without
        # per-word timings, and refuse the move if it would starve either cue
        kept_chars = len(" ".join(words))
        total_chars = kept_chars + 1 + len(" ".join(tail))
        new_end = cur["start"] + span * (kept_chars / total_chars)
        if new_end - cur["start"] < MIN_DWELL or nxt["end"] - new_end < MIN_DWELL:
            continue

        cur["text"] = " ".join(words)
        cur["end"] = round(new_end, 3)
        nxt["text"] = " ".join(tail + nxt["text"].split())
        nxt["start"] = round(new_end, 3)
        moved += len(tail)

    after_text = " ".join(c["text"] for c in cues)
    assert after_text == before_text, "caption TEXT changed; this tool may only re-break it"
    for x, y in zip(cues, cues[1:]):
        assert y["start"] >= x["end"] - 1e-6, f"cue overlap at {x['text']!r}"
        assert x["end"] - x["start"] >= MIN_DWELL - 1e-6, f"cue too short: {x['text']!r}"

    print(f"re-broke {moved} dangling word(s) across {len(cues)} cues")
    for c in cues[:12]:
        print(f"  {c['start']:6.2f} {c['text']}")
    if a.dry_run:
        print("(dry run, nothing written)")
        return
    json.dump(raw, open(a.src, "w"), indent=1)
    print(f"wrote {a.src}")


if __name__ == "__main__":
    main()
