#!/usr/bin/env python3
"""Gate visible source/props prose, not pixels or OCR.

Checks the current episode's Type.text, Label.text, Note.title, Lever.label and
HEADS literals (including ternaries/defaults), plus the actual built captions,
beat labels and credits. Unknown source expressions and empty extraction block.
Imported artwork text and Gmail are outside this focused adapter's coverage.
"""
import argparse
from html.parser import HTMLParser
import json
import re
from pathlib import Path
from urllib.parse import urlsplit

if __package__:
    from .caption_check import BANNED_FORMAL
    from .text_fit_check import collect_labels
else:
    from caption_check import BANNED_FORMAL
    from text_fit_check import collect_labels

REPO = Path(__file__).resolve().parents[1]
BANNED_PUNCT = {":": "colon", ";": "semicolon", "\u2014": "em dash", "\u2013": "en dash"}
URL = re.compile(r"https?://[^\s<>\"'\u2014\u2013]+", re.I)


def prose_only(text):
    """Mask actual HTTP(S) URL tokens, retaining adjacent sentence punctuation.

    Do not erase colons generally, or excuse an entire line because it has a URL.
    Internal URL path/query punctuation belongs to the identifier, not prose.
    """
    def mask(match):
        token = match.group().rstrip(".,;:!?)]}\u2014\u2013")
        try:
            parsed = urlsplit(token)
            valid = parsed.scheme.lower() in {"http", "https"} and bool(parsed.hostname)
        except ValueError:
            valid = False
        if not valid:
            return match.group()
        return " " * len(token) + match.group()[len(token):]
    return URL.sub(mask, text)


def violations(text):
    prose = prose_only(text)
    reasons = [name for char, name in BANNED_PUNCT.items() if char in prose]
    reasons += [f"{word} (use {replacement})" for word, replacement in BANNED_FORMAL.items()
                if re.search(r"\b" + re.escape(word) + r"\b", prose, re.I)]
    return reasons


def visible_html_text(html):
    """Decode text nodes, excluding head/style/script and HTML attribute syntax.

    This is a template-text audit, not a browser visibility or CSS/OCR assertion.
    Preserve inline joins so ``can<b>not</b>`` is still checked as one word.
    """
    class TextNodes(HTMLParser):
        def __init__(self):
            super().__init__(convert_charrefs=True)
            self.parts = []
            self.ignored = []

        def handle_starttag(self, tag, attrs):
            if tag in {"head", "style", "script"}:
                self.ignored.append(tag)
            if not self.ignored and tag in {"div", "p", "br", "li", "tr", "td", "h1", "h2", "h3"}:
                self.parts.append("\n")

        def handle_endtag(self, tag):
            if self.ignored:
                if tag == self.ignored[-1]:
                    self.ignored.pop()
            elif tag in {"div", "p", "li", "tr", "td", "h1", "h2", "h3"}:
                self.parts.append("\n")

        def handle_data(self, data):
            if not self.ignored:
                self.parts.append(data)

    parser = TextNodes()
    parser.feed(html)
    parser.close()
    return "".join(parser.parts)


def check_email_copy(subject, html):
    """Reusable final-payload check, not automatically wired into email delivery."""
    failures = []
    for location, text in (("subject", subject), ("html text", visible_html_text(html))):
        if not text.strip():
            failures.append({"location": location, "text": text, "why": ["No visible text extracted"]})
        for line in text.splitlines():
            reasons = violations(line)
            if reasons:
                failures.append({"location": location, "text": line.strip(), "why": reasons})
    return {"status": "FAIL" if failures else "PASS", "failures": failures}


def check(files, props_path):
    failures, issues, counts = [], [], {"source": 0, "captions": 0, "beats": 0, "credits": 0}

    def inspect(text, location, group):
        if not isinstance(text, str):
            issues.append({"location": location, "why": "Expected visible text string"})
            return
        if not text.strip():
            return
        counts[group] += 1
        reasons = violations(text)
        if reasons:
            failures.append({"location": location, "text": text, "why": reasons})

    if not files:
        issues.append({"location": "source", "why": "No current episode source resolved"})
    for path in files:
        data = collect_labels(path, props_path)
        for issue in data.get("copy_issues", []):
            issues.append({"location": f"{path}:{issue['line']}", "why": issue["why"]})
        before = counts["source"]
        for item in data.get("copy_literals", []):
            inspect(item["text"], f"{path}:{item['line']} {item['kind']}", "source")
        if counts["source"] == before:
            issues.append({"location": str(path), "why": "ZERO nonempty source display strings extracted"})
    try:
        props = json.loads(Path(props_path).read_text())
        if not isinstance(props, dict):
            raise ValueError("Props must be an object")
        for field, key in (("captions", "text"), ("beats", "label")):
            rows = props.get(field)
            if not isinstance(rows, list) or not rows:
                issues.append({"location": str(props_path), "why": f"Missing or empty {field}"})
                continue
            for i, row in enumerate(rows):
                inspect(row.get(key) if isinstance(row, dict) else None,
                        f"{props_path} {field}[{i}].{key}", field)
        credits = props.get("credits", {})
        if not isinstance(credits, dict):
            raise ValueError("Credits must be an object")
        for key in ("music", "site"):
            inspect(credits.get(key), f"{props_path} credits.{key}", "credits")
        sources = credits.get("sources")
        if not isinstance(sources, list) or not sources:
            issues.append({"location": str(props_path), "why": "Missing or empty credit sources"})
        else:
            for i, text in enumerate(sources):
                inspect(text, f"{props_path} credits.sources[{i}]", "credits")
    except (OSError, ValueError) as exc:
        issues.append({"location": str(props_path), "why": f"Props extraction failed: {exc}"})
    for group, count in counts.items():
        if not count:
            issues.append({"location": group, "why": "ZERO nonempty visible strings checked"})
    return {"status": "FAIL" if failures or issues else "PASS", "checked": counts,
            "failures": failures, "issues": issues,
            "scope": "Source/props copy adapter only. Not OCR, imported artwork text, or Gmail."}


def main():
    from caption_band_check import default_targets
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("files", nargs="*")
    parser.add_argument("--props", default=str(REPO / "out/dispatch/episode_props.json"))
    args = parser.parse_args()
    result = check(args.files or default_targets(), args.props)
    print(json.dumps(result, indent=2))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
