#!/usr/bin/env python3
"""The owner's banned words, as whole words, for every surface that reads them.

OWNER RULE 2026-09-27: "on both automations ban the words" "gap", "matters" and "pattern"
(and "gaps", "patterns"). The carousel repo enforced it from that day; this repo did not,
and on 2026-10-03 a Dispatch post containing "matters" passed caption_check.py and was
caught by hand. The list lives in config/brand.yaml `brand.banned_vocabulary`, so the rule
is data and a change to it is never a code change.

Whole words only ("Singapore", "no matter" pass). A straight-quoted passage ("...") and a
URL keep their words, because a quotation is the source's wording and not ours.

  python3 scripts/word_ban.py FILE...    # exit 1 and name each hit
  python3 scripts/word_ban.py --self-test
"""
import os
import re
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BRAND = os.path.join(REPO, "config", "brand.yaml")
_URL = re.compile(r"(?:https?://|www\.)\S+|\b[\w-]+\.(?:com|org|gov|net|edu|us|io)(?:/\S*)?", re.I)
_QUOTE = re.compile(r'"[^"\n]*"')


def banned_words():
    import yaml
    doc = yaml.safe_load(open(BRAND)) or {}
    return [str(w).lower() for w in (doc.get("brand", {}).get("banned_vocabulary") or [])]


# Machine pass 2026-10-24 (queue 2026-10-08, brand-banned-phrases-in-vo): "disrupt" is in
# brand.banned_phrases and ran in the VO, the plates and the post, because every gate read only
# banned_vocabulary. A one-word phrase also catches its verb forms ("disrupted", "revolutionizing")
# and not its noun ("disruption" is ordinary news English). brand.yaml bans "leverage" AS A VERB,
# so it matches only "to leverage" and the inflected forms, never "the state has leverage".
_VERB_ONLY = {"leverage": r"\bto leverage\b|\bleverag(?:es|ed|ing)\b"}


def banned_phrases():
    import yaml
    doc = yaml.safe_load(open(BRAND)) or {}
    return [str(w).lower() for w in (doc.get("brand", {}).get("banned_phrases") or [])]


def _phrase_rx(phrase):
    if phrase in _VERB_ONLY:
        return _VERB_ONLY[phrase]
    if re.fullmatch(r"[a-z]+", phrase):
        stem = phrase[:-1] if phrase.endswith("e") else phrase
        return r"\b" + re.escape(stem) + r"(?:e|es|ed|ing|s|d)?\b"
    return r"\b" + re.escape(phrase).replace("\\ ", r"\s+") + r"s?\b"


def phrase_hits(text, phrases=None):
    """The brand's banned phrases used in `text`, outside quotes and URLs, in list order."""
    phrases = banned_phrases() if phrases is None else phrases
    t = _QUOTE.sub(" ", _URL.sub(" ", text.replace("\u2019", "'")))
    return [p for p in phrases if re.search(_phrase_rx(p), t, re.I)]


def hits(text, words=None):
    """The banned words used in `text`, in order of first use, outside quotes and URLs."""
    words = banned_words() if words is None else words
    t = _QUOTE.sub(" ", _URL.sub(" ", text))
    found = []
    for m in re.finditer(r"\b(" + "|".join(map(re.escape, words)) + r")\b", t, re.I) if words else []:
        w = m.group(1).lower()
        if w not in found:
            found.append(w)
    return found


def _self_test():
    words = banned_words()
    cases = [("Here is why it matters to Anchorage.", ["matters"]),
             ("The gap closed. Two gaps remain, and a pattern.", ["gap", "gaps", "pattern"]),
             ("Singapore is no matter here, and the gaping hole.", []),
             ('The agency said "the gap is real" in its filing.', []),
             ("See noaa.gov/pattern-report for it.", [])]
    bad = 0
    print(f"  list from config/brand.yaml: {words}")
    for text, want in cases:
        got = hits(text, words)
        ok = got == want
        bad += not ok
        print(f"  [{'x' if ok else ' '}] {text!r} -> {got}")
    ok = set(words) >= {"gap", "gaps", "matters", "pattern", "patterns"}
    bad += not ok
    print(f"  [{'x' if ok else ' '}] the owner's five words are all in the list")
    phrases = banned_phrases()
    pcases = [("This could disrupt the fishery.", ["disrupt"]),
              ("Vendors disrupted it, revolutionizing nothing.", ["revolutionize", "disrupt"]),
              ("A supply disruption closed the road.", []),
              ("The state has leverage here.", []),
              ("They want to leverage the data.", ["leverage"]),
              ("Here\u2019s the honest part. Buckle up.", ["buckle up", "here's the honest part"]),
              ('The CEO said "we will disrupt it" on the call.', [])]
    for text, want in pcases:
        got = phrase_hits(text, phrases)
        ok = sorted(got) == sorted(want)
        bad += not ok
        print(f"  [{'x' if ok else ' '}] phrase {text!r} -> {got}")
    print("SELF-TEST", "FAIL" if bad else "PASS")
    return 1 if bad else 0


def main(argv):
    if "--self-test" in argv:
        return _self_test()
    rc = 0
    for path in argv:
        text = open(path, encoding="utf-8").read()
        h = hits(text)
        if h:
            rc = 1
            print(f"FAIL [word_ban] {path}: {', '.join(h)} (owner rule 2026-09-27)")
        ph = phrase_hits(text)
        if ph:
            rc = 1
            print(f"FAIL [word_ban] {path}: banned phrase {', '.join(ph)} (config/brand.yaml banned_phrases)")
    return rc


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
