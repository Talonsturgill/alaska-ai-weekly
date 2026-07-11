#!/usr/bin/env python3
"""style_lint.py — pre-flight house-style lint for authored copy.

Purpose: the SHIP-time gate in scripts/site_build.py (`prose_colon_gate`)
refuses prose colons on every emitted page, because house style bans them
(clock times like 4:30 and URLs are exempt, they are not prose). That gate is
correct and must never weaken, but it only fires at ship, AFTER the docket
note (Phase 3.5) and copy.json (Phase 6) are written -- so runs 2026-07-09 and
2026-07-10 each tripped it TWICE and had to rephrase under ship-time pressure
(a docket history note, then copy.json's first_comment lead line). This helper
runs the SAME rule EARLY, where the text is authored, so the fix happens before
ship. It moves the catch earlier; it does not replace or loosen the gate.

The colon transform below is a byte-for-byte replica of
site_build.prose_colon_gate (strip script/style, tags -> newlines, drop URLs
and clock times, then any remaining ':' on a line is a violation). Keep the two
in sync; if site_build's rule changes, mirror it here.

Usage:
  echo "Sources for today's deck:" | python scripts/style_lint.py
  python scripts/style_lint.py --file out/<date>/docket_note.txt
  python scripts/style_lint.py --file out/<date>/copy.json --json-field first_comment
  python scripts/style_lint.py --file copy.json --json-field .   # lint every string

Exit 0 = clean, 1 = at least one prose colon (offending lines printed to stderr).
"""
import argparse
import json
import re
import sys


def colon_violations(text):
    """Return the list of offending (stripped) lines, replicating exactly
    scripts/site_build.py::prose_colon_gate."""
    txt = re.sub(r"(?s)<(script|style)[^>]*>.*?</\1>", " ", text)
    txt = re.sub(r"<[^>]+>", "\n", txt)
    txt = re.sub(r"https?://\S+", " ", txt)
    txt = re.sub(r"\d{1,2}:\d{2}", " ", txt)
    return [line.strip() for line in txt.split("\n") if ":" in line]


def collect_strings(node):
    """Yield every string in a JSON subtree (field values, list items, nested)."""
    if isinstance(node, str):
        yield node
    elif isinstance(node, dict):
        for v in node.values():
            yield from collect_strings(v)
    elif isinstance(node, list):
        for v in node:
            yield from collect_strings(v)


def navigate(obj, dotpath):
    if dotpath in ("", "."):
        return obj
    cur = obj
    for key in dotpath.strip(".").split("."):
        if not isinstance(cur, dict) or key not in cur:
            print(f"FAIL: --json-field {dotpath!r}: no key {key!r}", file=sys.stderr)
            sys.exit(2)
        cur = cur[key]
    return cur


def main():
    ap = argparse.ArgumentParser(description="pre-flight prose-colon lint (mirrors site_build)")
    ap.add_argument("--file", help="text or .json file to lint; omit to read stdin")
    ap.add_argument("--json-field", help="dot-path into a .json file; '.' lints every string")
    args = ap.parse_args()

    strings = []
    if args.json_field is not None:
        if not args.file:
            print("FAIL: --json-field requires --file <json>", file=sys.stderr)
            sys.exit(2)
        obj = json.loads(open(args.file, encoding="utf-8").read())
        strings = list(collect_strings(navigate(obj, args.json_field)))
    elif args.file:
        strings = [open(args.file, encoding="utf-8").read()]
    else:
        strings = [sys.stdin.read()]

    bad = []
    for s in strings:
        bad.extend(colon_violations(s))
    if bad:
        for line in bad:
            print(f"FAIL: prose colon in {line[:80]!r}", file=sys.stderr)
        print(f"{len(bad)} prose-colon violation(s); rephrase before ship "
              f"(site_build's ship gate will otherwise block).", file=sys.stderr)
        sys.exit(1)
    print("style_lint: clean (no prose colons)")
    sys.exit(0)


if __name__ == "__main__":
    main()
