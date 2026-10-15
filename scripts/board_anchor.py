#!/usr/bin/env python3
"""Word anchors for a per-run board script (board_<MMDD>.py), resolved LOUDLY.

A board beat anchors to (vo_line, a spoken word, which occurrence). On `conform`, the beat's time is
that word's onset in out/dispatch/audio/words.json. The board scripts used to fall back quietly when
the word was not in the aligned read: first to the word's index in the script line, then to the
middle of the line. That fallback is right before the voice exists (`gen`, estimated timing) and
wrong after it, because a missing word on conform means the VO was edited and the board was not.

2026-10-15 "The Door With a Condition": an honest VO edit removed the clause "favors whoever builds
first". The beat anchored inside it fell back to mid-line, landed 0.29 s before its neighbour, and
the first anyone heard of it was build_evidence failing on a beat too short for its motion strip,
after a full render. Queued as vo-edit-orphans-board-beats; fixed in the 2026-10-15 machine pass.

Use from a board script:

    from board_anchor import AnchorBook
    book = AnchorBook(words_by_line, real=real, lines=LINES)
    t = book.word(line, "Except", 1, line_start, line_end)   # in at()
    ...
    book.raise_if_missing()   # before writing storyboard.json; exits 1 naming every orphan

    python3 scripts/board_anchor.py --self-test
"""
import sys

LEAD_S = 0.05   # a beat starts a hair before the word it anchors to (the board scripts' convention)


def norm(s):
    return "".join(c for c in str(s).lower() if c.isalnum())


class AnchorMissing(SystemExit):
    pass


class AnchorBook:
    """Resolves word anchors and remembers every one that did not resolve against the real read."""

    def __init__(self, words_by_line, real, lines=None):
        self.words = words_by_line or {}
        self.real = bool(real)
        self.lines = lines or []
        self.missing = []

    def word(self, line, want, nth, line_start, line_end):
        hits = [x for x in self.words.get(line, []) if norm(x["w"]) == norm(want)]
        if len(hits) >= nth:
            return max(line_start, float(hits[nth - 1]["s"]) - LEAD_S)
        if self.real:
            heard = " ".join(x["w"] for x in self.words.get(line, [])) or "(no aligned words for this line)"
            self.missing.append(f"line {line}: anchor word {want!r} occurrence {nth} is not in words.json "
                                f"(found {len(hits)}). The aligned read of this line is: {heard}")
        # Estimated timing (no voice yet), or an orphan that raise_if_missing() will refuse.
        text = self.lines[line] if line < len(self.lines) else ""
        toks = [norm(t) for t in text.split()]
        if norm(want) in toks:
            return line_start + (line_end - line_start) * (toks.index(norm(want)) / max(1, len(toks)))
        return line_start + 0.5 * (line_end - line_start)

    def raise_if_missing(self, who="board conform"):
        if not self.missing:
            return
        msg = [f"{who}: {len(self.missing)} beat anchor(s) point at words the voice no longer says. "
               "The VO was edited and the board was not. Re-anchor each beat to a word in the new read "
               "(or to a fraction of the line), then conform again. Nothing was written."]
        msg += ["  " + m for m in self.missing]
        raise AnchorMissing("\n".join(msg))


def _self_test():
    words = {0: [{"w": "Except", "s": 1.20}, {"w": "the", "s": 1.6}, {"w": "vote", "s": 1.9}],
             1: [{"w": "builds", "s": 5.0}]}
    lines = ["Except the vote.", "Nobody builds first."]
    book = AnchorBook(words, real=True, lines=lines)
    assert abs(book.word(0, "except", 1, 0.5, 4.0) - 1.15) < 1e-9
    assert book.missing == []
    book.word(1, "favors", 1, 4.0, 8.0)          # the 10-15 orphan: the word was cut from the read
    book.word(0, "the", 2, 0.5, 4.0)             # a second occurrence that is not there
    assert len(book.missing) == 2, book.missing
    try:
        book.raise_if_missing()
        raise AssertionError("an orphaned anchor on conform must refuse")
    except AnchorMissing as exc:
        assert "favors" in str(exc) and "Nothing was written" in str(exc)
    est = AnchorBook({}, real=False, lines=lines)  # gen: no voice yet, estimates are expected
    assert abs(est.word(1, "builds", 1, 4.0, 8.0) - (4.0 + 4.0 / 3)) < 1e-9
    est.raise_if_missing()
    print("board_anchor self-test: PASS (resolve, orphan refused on conform, estimate allowed on gen)")


if __name__ == "__main__":
    if "--self-test" in sys.argv:
        _self_test()
    else:
        print(__doc__)
