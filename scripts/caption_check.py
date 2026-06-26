#!/usr/bin/env python3
"""Objective gate for the LinkedIn caption (Phase 6B Gate A).

Usage: python scripts/caption_check.py out/caption.txt
Exits 0 (PASS) or 1 (FAIL). Writes out/caption_report.json.
"""
import sys, json, re
from pathlib import Path

BANNED_PHRASES = [
    "game-changer", "revolutionize", "disrupt", "synergy",
    "leverage", "buckle up", "let's dive in", "in a world where",
    "imagine if", "it's no secret that", "in an era", "excited to share",
    "i'm thrilled", "i'm excited", "here's the honest part",
    "here's what matters", "here's where the frame breaks",
]

BANNED_PUNCTUATION = re.compile(r"[—–;""'']")   # em-dash, en-dash, semicolon, curly quotes

def check(path):
    txt = Path(path).read_text(encoding="utf-8").strip()
    fails = []

    # Split body vs hashtag line
    lines = txt.splitlines()
    hashtag_line = ""
    body_lines = []
    for ln in reversed(lines):
        if ln.strip().startswith("#") or re.match(r"^\s*#\w", ln):
            hashtag_line = ln.strip()
            break
    body = "\n".join(
        l for l in lines
        if not (l.strip().startswith("#") and l == lines[-1 - lines[::-1].index(l)])
    ).strip()

    # Pull hashtags from the last non-empty line
    last_nonempty = ""
    for ln in reversed(lines):
        if ln.strip():
            last_nonempty = ln.strip()
            break
    hashtags_in_last = re.findall(r"#\w+", last_nonempty)
    hashtags_in_body = re.findall(r"#\w+", "\n".join(lines[:-1]))

    body_chars = len(body)
    first_line = lines[0].strip() if lines else ""
    hook_chars = len(first_line)

    # Gate checks
    if hook_chars > 140:
        fails.append(f"HOOK_TOO_LONG: first line is {hook_chars} chars (max 140)")

    if not (1300 <= body_chars <= 3000):
        fails.append(f"BODY_LENGTH: {body_chars} chars (need 1300-3000)")

    hashtag_count = len(hashtags_in_last)
    if not (3 <= hashtag_count <= 5):
        fails.append(f"HASHTAG_COUNT: {hashtag_count} hashtags in last line (need 3-5)")

    if hashtags_in_body:
        fails.append(f"HASHTAGS_IN_BODY: {hashtags_in_body[:3]} — hashtags must only appear on the final line")

    # Closing question
    body_stripped = body.rstrip()
    has_question = "?" in body_stripped[-300:]
    if not has_question:
        fails.append("NO_CTA_QUESTION: last 300 chars has no '?' — need a closing question")

    # Banned punctuation
    bp_hits = BANNED_PUNCTUATION.findall(body)
    if bp_hits:
        fails.append(f"BANNED_PUNCTUATION: {set(bp_hits)} found in body")

    # Banned opener
    opener = first_line.lower()
    banned_openers = ["in an era", "imagine", "it's no secret", "excited to share",
                      "i'm thrilled", "i'm excited", "let's dive in", "buckle up"]
    for bo in banned_openers:
        if opener.startswith(bo):
            fails.append(f"BANNED_OPENER: starts with '{bo}'")

    # Banned phrases
    body_lower = body.lower()
    for bp in BANNED_PHRASES:
        if bp in body_lower:
            fails.append(f"BANNED_PHRASE: '{bp}'")

    # Emoji count (rough)
    emoji_count = sum(1 for c in txt if ord(c) > 0x2600)
    if emoji_count > 3:
        fails.append(f"TOO_MANY_EMOJI: {emoji_count} (max 3)")

    passed = len(fails) == 0
    report = {
        "passed": passed,
        "hook_chars": hook_chars,
        "body_chars": body_chars,
        "hashtag_count": hashtag_count,
        "has_question": has_question,
        "failures": fails,
    }

    out_path = Path(path).parent / "caption_report.json"
    out_path.write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))

    if passed:
        print("\nGATE A: PASS", file=sys.stderr)
        sys.exit(0)
    else:
        print(f"\nGATE A: FAIL — {len(fails)} issue(s):", file=sys.stderr)
        for f in fails:
            print(f"  - {f}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: caption_check.py <caption.txt>", file=sys.stderr); sys.exit(2)
    check(sys.argv[1])
