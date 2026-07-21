#!/usr/bin/env python3
"""caption_check.py — OBJECTIVE linter for the LinkedIn carousel post copy.

Runs BEFORE the scorer so a mechanically-broken caption never reaches the
subjective gates. Grounded in the 2026 evidence base (knowledge/
CAROUSEL_CRAFT.md): 140-char mobile fold, 300-900 char band for carousel
captions, exactly 3 hashtags at the end, no links in body, brand punctuation
rules (no em/en dashes, no semicolons, straight quotes), AI-tell scan,
closing engagement question required.

  python scripts/caption_check.py out/<run>/caption.txt
Writes caption_report.json next to the input. Exit 0 = PASS, 1 = FAIL.
"""
import json
import re
import sys
from pathlib import Path

FOLD = 140
LO, HI = 300, 900
HARD_MAX = 3000
HASHTAGS_EXACTLY = 3

AI_TELLS = ["delve", "tapestry", "testament", "landscape of", "ever-evolving",
            "ever-changing", "in today's", "navigating the", "unlock the",
            "unleash", "game-changer", "game changer", "realm of",
            "at the end of the day", "it's important to note", "paradigm",
            "synergy", "embark", "seamless", "cutting-edge", "revolutionize",
            "supercharge", "skyrocket", "buckle up", "let's dive",
            "here's the honest part", "here is the honest part",
            "here's what matters", "here is what matters", "imagine if",
            "in a world where", "it's no secret"]
BANNED_PUNCT = {"—": "em dash", "–": "en dash", ";": "semicolon",
                "“": "curly quote", "”": "curly quote",
                "‘": "curly apostrophe", "’": "curly apostrophe"}
EMOJI = re.compile("[\U0001F000-\U0001FAFF\U00002600-\U000027BF\U0001F1E6-\U0001F1FF←-⇿⌀-⏿]")
UNICODE_BOLD = re.compile("[\U0001D400-\U0001D7FF]")
URLISH = re.compile(r"https?://|www\.|\S+\.(com|org|net|io|gov|edu)/\S*", re.I)


def lint(text):
    fails, warns = [], []
    t = text.rstrip("\n")
    lines = t.split("\n")
    nonempty = [l for l in lines if l.strip()]

    # hook
    hook = nonempty[0].strip() if nonempty else ""
    if not hook:
        fails.append("HOOK: empty first line")
    elif len(hook) > FOLD:
        fails.append(f"HOOK: first line {len(hook)} chars > {FOLD} mobile fold")
    if hook.endswith("?"):
        warns.append("HOOK: opens with a question; declarative openers test better")

    # length
    n = len(t)
    if n > HARD_MAX:
        fails.append(f"LENGTH: {n} > {HARD_MAX} LinkedIn cap")
    elif not (LO <= n <= HI):
        fails.append(f"LENGTH: {n} chars outside {LO}-{HI} carousel band")

    # hashtags: exactly 3, all in the trailing block
    tags = re.findall(r"(?<!\w)#\w+", t)
    if len(tags) != HASHTAGS_EXACTLY:
        fails.append(f"HASHTAGS: {len(tags)} found, need exactly {HASHTAGS_EXACTLY}")
    if tags:
        last_line = nonempty[-1]
        if not all(w.startswith("#") for w in last_line.split()):
            fails.append("HASHTAGS: final line must be only the hashtags")
        body_wo_last = "\n".join(nonempty[:-1])
        if re.findall(r"(?<!\w)#\w+", body_wo_last):
            fails.append("HASHTAGS: hashtags found mid-copy; all must be in the tail line")

    # links
    if URLISH.search(t):
        fails.append("LINKS: URL-like string in body (sources go in first comment)")

    # Sources and credits (music, audio, any production credit) belong ONLY
    # in the paste-ready comment blocks, never in the post (maintainer rule,
    # 2026-07-21: a delivered draft carried sources AND music credits in the
    # post above the hashtags as well as in their own sections).
    # Two shapes: a sources header ("Sources...", "Sources for this deck") and a
    # credit line ("Music, X", "Audio by Y", "Credits..."). Media words need the
    # stronger by/courtesy/credit signal so story sentences like "Sound in Cook
    # Inlet has doubled" never false-positive.
    if re.search(r"(?im)^\s*(sources?|credits?)\b\s*($|[:,]|for\b|below\b|in\b)"
                 r"|^\s*(music|audio|soundtrack|sound|track)\b\s*([:,]|by\b|courtesy\b|credits?\b)", t):
        fails.append("SOURCES/CREDITS: sources or credits block in the post copy; "
                     "they go ONLY in the comment paste blocks")

    # colons are banned in the caption, ever (maintainer rule, 2026-07-21;
    # brand.yaml previously allowed them and captions kept shipping with
    # them). Clock times like 4:30 are the only pass.
    if ":" in re.sub(r"\d{1,2}:\d{2}", " ", t):
        fails.append("PUNCT: colon present (never use colons; rewrite the sentence)")

    # punctuation & characters
    for ch, name in BANNED_PUNCT.items():
        if ch in t:
            fails.append(f"PUNCT: {name} present")
    if EMOJI.search(t):
        fails.append("EMOJI: emoji present")
    if UNICODE_BOLD.search(t):
        fails.append("UNICODE: math-alphanumeric fake bold/italic present")

    # AI tells + banned phrases
    low = t.lower()
    for tell in AI_TELLS:
        if tell in low:
            fails.append(f"PHRASE: banned/AI-tell '{tell}'")

    # engagement question: last non-hashtag line ends with ?
    content_lines = [l for l in nonempty if not all(w.startswith("#") for w in l.split())]
    if content_lines and not content_lines[-1].strip().endswith("?"):
        fails.append("CLOSE: final content line must be an engagement question ending with ?")

    # deck summary heuristic: some line mentions slides/deck/carousel or a count
    if not re.search(r"\b(\d+\s+slides?|swipe|deck|carousel|walks? through)\b", low):
        warns.append("SUMMARY: no deck-summary line detected (accessibility + ranker)")

    return {"chars": n, "hook": hook, "hook_len": len(hook),
            "hashtags": tags, "fails": fails, "warns": warns,
            "verdict": "FAIL" if fails else "PASS"}


def main():
    if len(sys.argv) > 1:
        src = Path(sys.argv[1])
        text = src.read_text()
        out = src.parent / "caption_report.json"
    else:
        text = sys.stdin.read()
        out = Path("caption_report.json")
    rep = lint(text)
    out.write_text(json.dumps(rep, indent=2))
    for f in rep["fails"]:
        print("FAIL:", f)
    for w in rep["warns"]:
        print("warn:", w)
    print(f"verdict: {rep['verdict']} ({rep['chars']} chars, hook {rep['hook_len']}) -> {out}")
    sys.exit(1 if rep["fails"] else 0)


if __name__ == "__main__":
    main()
