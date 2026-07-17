#!/usr/bin/env python3
"""copy_sync_check.py -- catch the record-sync gap between copy.json and the
shipped render.

WHY THIS EXISTS
    During pixel/flow review the showrunner sometimes edits display text
    directly in a slide's HTML (a kicker, a headline, a tag, a label) and
    forgets to sync copy.json back to it. copy.json then goes stale and the
    only thing that notices is the scorer's transcription pass, late in the
    run. Run 2026-07-17: slide-05's kicker was hand-edited "HOW IT STARTED"
    -> "BEFORE THE CLASS" in the HTML but copy.json still said "HOW IT
    STARTED" until the scorer caught it. There was no machine check.

WHAT IT DOES
    For every slide string in copy.json["slides"], verify that the string is
    actually present in that slide's RENDERED text (render_report.json's
    per-slide text_nodes[].text, which is what the browser laid out). This is
    one-directional by design: every authored slide string must appear in the
    render (copy must not go stale). It does NOT require every rendered node
    to appear in copy (decorative micro-text, coordinates, and progress
    counters live only in the HTML and would be noise).

MATCHING
    Comparison is on letters+digits only (case-insensitive, punctuation and
    whitespace ignored) so straight-quote / spacing / slash-spacing
    differences never trip it. render.py stores each node's text truncated to
    the first 80 characters (.slice(0,80)); to tolerate that truncation for
    long body prose, strings longer than the prefix window are matched on
    their leading WINDOW (default 40) alphanumeric characters. Short display
    strings -- exactly the record-sync risk class -- are matched in full. A
    string is satisfied if its needle appears in its own slide's rendered
    blob OR anywhere in the deck's rendered blob.

EXIT CODES
    0  every authored slide string is present in the render (in sync)
    1  one or more authored slide strings are missing from the render (stale)
    2  usage / missing-file error

This script reads only; it never edits copy.json or any slide. It is a
pre-ship tripwire, not a gate that can be weakened. Fix a reported mismatch
by reconciling copy.json to the shipped render (or vice versa) before ship.
"""

import argparse
import json
import re
import sys

WINDOW = 40

# Keys that hold metadata / bookkeeping, never rendered slide text.
SKIP_KEYS = {"note", "beat", "claim_ids", "claim_id", "words", "lines"}


def alnum(s):
    return re.sub(r"[^A-Z0-9]", "", s.upper())


def collect(obj, path):
    """Yield (dotted_path, string) for every rendered-text leaf under a slide,
    skipping metadata keys and the redundant 'lines' mirrors of a parent
    .text field."""
    out = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in SKIP_KEYS:
                continue
            out += collect(v, path + "." + k if path else k)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            out += collect(v, "%s[%d]" % (path, i))
    elif isinstance(obj, str):
        if re.search(r"[A-Za-z]", obj):
            out.append((path, obj))
    return out


def slide_index(fname):
    m = re.search(r"slide-(\d+)", fname)
    return int(m.group(1)) if m else None


def build_blobs(render_report):
    """Return (per_slide_blob_by_Skey, whole_deck_blob)."""
    per_slide = {}
    deck = []
    for s in render_report.get("slides", []):
        idx = slide_index(s.get("file", ""))
        if idx is None:
            continue
        blob = alnum(" ".join(n.get("text", "") for n in s.get("text_nodes", [])))
        per_slide["S%d" % idx] = blob
        deck.append(blob)
    return per_slide, "".join(deck)


def check(copy, render_report, window=WINDOW):
    per_slide, deck = build_blobs(render_report)
    misses = []
    checked = 0
    slides = copy.get("slides", {})
    for skey, sval in slides.items():
        blob = per_slide.get(skey, "")
        for path, s in collect(sval, ""):
            a = alnum(s)
            if not a:
                continue
            checked += 1
            needle = a if len(a) <= window else a[:window]
            if needle in blob or needle in deck:
                continue
            misses.append((skey, path, s))
    return checked, misses, set(per_slide.keys())


def main():
    ap = argparse.ArgumentParser(description="Verify copy.json slide strings appear in the render.")
    ap.add_argument("--copy", required=True, help="path to copy.json")
    ap.add_argument("--render-report", required=True, help="path to render/render_report.json")
    ap.add_argument("--window", type=int, default=WINDOW,
                    help="alphanumeric prefix window for long strings (default 40)")
    args = ap.parse_args()

    try:
        copy = json.load(open(args.copy))
    except (OSError, ValueError) as e:
        print("copy_sync_check: cannot read copy.json: %s" % e, file=sys.stderr)
        return 2
    try:
        rr = json.load(open(args.render_report))
    except (OSError, ValueError) as e:
        print("copy_sync_check: cannot read render_report.json: %s" % e, file=sys.stderr)
        return 2

    if "slides" not in copy:
        print("copy_sync_check: copy.json has no 'slides' object", file=sys.stderr)
        return 2

    checked, misses, rendered_keys = check(copy, rr, args.window)

    # Slides authored in copy but with no rendered counterpart are their own
    # (softer) signal; surface them but do not fail on them.
    authored = set(copy["slides"].keys())
    orphan = sorted(authored - rendered_keys, key=lambda s: int(s[1:]) if s[1:].isdigit() else 0)
    for o in orphan:
        print("copy_sync_check: WARN slide %s in copy.json has no rendered slide" % o, file=sys.stderr)

    if not misses:
        print("copy_sync_check: PASS -- %d authored slide strings all present in the render" % checked)
        return 0

    print("copy_sync_check: FAIL -- %d authored slide string(s) not found in the render:" % len(misses))
    for skey, path, s in misses:
        shown = s if len(s) <= 70 else s[:67] + "..."
        print("  %s  %s  -> %r" % (skey, path, shown))
    print("Reconcile copy.json to the shipped render (or fix the render) before ship.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
