#!/usr/bin/env python3
"""No first person, anywhere the audience can read or hear it.

Owner directive 2026-08-05: "the caption should never say 'I' or speak in the first
person." caption_check.py enforces this on the social copy; this enforces it on the FILM,
which is the surface the rule was actually about and the one no linter was watching.

Why it matters beyond style: the Dispatch is a wire report. First person turns a sourced
finding into one person's take, which a reader can dismiss without engaging the source. It
also does not survive being read by someone who has no idea who "I" is, which on a feed is
almost everyone.

"we" and "our" are NOT banned. The brand may speak as itself. What is banned is the
singular narrator inserting themselves into a sourced report.
"""
import json, os, re, sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(REPO, "out", "dispatch")

# Case-sensitive on "I" and boundary-anchored so AI, FIRE-WUI and similar are untouched.
FIRST_PERSON = re.compile(r"(?<![A-Za-z-])(?:I|I'm|I've|I'd|I'll|me|my|mine|myself)(?![A-Za-z'-])")


def main():
    checked = 0
    fails = []

    sp = os.path.join(OUT, "vo_script.json")
    if os.path.exists(sp):
        for l in json.load(open(sp)).get("lines", []):
            checked += 1
            m = FIRST_PERSON.search(l.get("t", ""))
            if m:
                fails.append(f"VO line {l.get('i')}: '{m.group(0)}' in {l.get('t')!r}")

    cp = os.path.join(OUT, "captions.json")
    if os.path.exists(cp):
        for c in json.load(open(cp)):
            checked += 1
            m = FIRST_PERSON.search(c.get("text", ""))
            if m:
                fails.append(f"caption at {c.get('start')}s: '{m.group(0)}' in {c.get('text')!r}")

    for f in fails:
        print(f"FAIL first person -> {f}")
    print(f"voice-check: {checked} spoken lines and caption cues checked, {len(fails)} failing")
    if checked == 0:
        print("voice-check: GATE IS DEAD. It checked nothing, which is not a pass.")
        return 2
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
