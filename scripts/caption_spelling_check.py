#!/usr/bin/env python3
"""Hard gate: no phonetic respelling may survive into the BUILT episode props.

WHY THIS EXISTS (2026-08-08). The TTS script is phonetically respelled so the synth says
proper nouns correctly ("Ex Prize", "Nana" for Nenana, "A I" for AI). Captions are force
-aligned from Whisper's transcript OF THAT AUDIO, so the respelling is what lands on
screen unless something puts the real spelling back. build_scenes.py does exactly that,
from a `caption_fixups` map declared in vo_script.json.

That fix was correct and it still shipped the defect, because it is a TRANSFORM and not a
CHECK. On this run the map was declared at 06:44 and episode_props.json was built at 08:15
from a captions.json that a later line-patch had rewritten, and "A I" was on screen at
43.84s in a frame whose own plate read "AI" two inches above it. A panel judge called it a
hard blocker: wrong text on screen, contradicted by the same frame.

The transform runs at build time and leaves no trace anyone can audit. Nothing anywhere
asked the simple question afterwards: does the file we are about to RENDER still contain a
string we know is wrong? A pipeline that can only fix a defect at one instant, and cannot
detect it at any other, will ship it the first time the order of operations shifts.

So this reads the BUILT artifact, not the source, and it is deliberately dumb: every key of
caption_fixups is a string we have already declared must never appear on screen. If one is
in episode_props.json, the props are stale or the transform was bypassed. Either way the
answer is the same and it is cheap: re-run scripts/build_scenes.py.

Exit 0 clean, exit 1 with findings. Wire it BEFORE the render.
"""
import json
import os
import re
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(REPO, "out", "dispatch")

# SPELLED TOKENS THE MAP NEVER DECLARED (machine pass 2026-10-22, a repeat offender). The check
# above can only see a respelling somebody already wrote into caption_fixups. On 10-20 and again
# on 10-22 "C E O", "A I" and "D N R" reached the built captions because nobody had declared them
# yet, and both runs paid an editor round to learn it. A spaced initialism is never right on
# screen, so it is detected by shape, with or without a map. Spelled numbers are only a WARN at
# the script stage (vo_claims_check), because "two" or "once" on a caption is correct.
SPACED_INITIALISM = re.compile(r"(?<![A-Za-z0-9'])[A-Z](?: [A-Z]){1,}(?![A-Za-z0-9'])")
_UNITS = ("one two three four five six seven eight nine ten eleven twelve thirteen fourteen "
          "fifteen sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy "
          "eighty ninety").split()
_SCALES = ("hundred", "thousand", "million", "billion", "trillion")
_ORDINALS = ("first second third fourth fifth sixth seventh eighth ninth tenth eleventh twelfth "
             "thirteenth fourteenth fifteenth sixteenth seventeenth eighteenth nineteenth "
             "twentieth thirtieth").split()
_MONTHS = ("january february march april may june july august september october november "
           "december").split()
_NUM = r"(?:" + "|".join(_UNITS + list(_SCALES)) + r")"
_NUM_RUN = re.compile(r"(?<![A-Za-z0-9-])" + _NUM + r"(?:[ -]" + _NUM + r")*(?![A-Za-z0-9-])", re.I)
_DATE = re.compile(r"\b(?:" + "|".join(_MONTHS) + r")(?: " + _NUM + r")? (?:" + _NUM + r"[ -])?(?:"
                   + "|".join(_ORDINALS) + r")\b", re.I)


def spelled_tokens(text):
    """(kind, phrase) for every TTS spelling in a line that a caption should not show:
    a spaced initialism ("C E O"), a spelled number of two or more words or with a scale word
    ("forty five thousand eight hundred", "a hundred" is caught as "hundred"), and a spelled
    ordinal date ("October twentieth"). A single small number word ("two", "ten") is left
    alone, it is how a caption should read it."""
    hits = [("initialism", m.group(0)) for m in SPACED_INITIALISM.finditer(text)]
    for m in _DATE.finditer(text):
        hits.append(("date", m.group(0)))
    dated = " ".join(p for k, p in hits if k == "date").lower()
    for m in _NUM_RUN.finditer(text):
        p = m.group(0)
        words = re.split(r"[ -]", p.lower())
        if (len(words) >= 2 or words[0] in _SCALES) and p.lower() not in dated:
            hits.append(("number", p))
    return hits


def apply_fixups(text, fixups):
    """The same longest-first, alnum-boundary substitution build_scenes.apply_fixups makes."""
    for k, v in sorted(fixups.items(), key=lambda kv: -len(kv[0])):
        text = re.sub(r"(?<![A-Za-z0-9])" + re.escape(k) + r"(?![A-Za-z0-9])", v, text, flags=re.I)
    return text


def uncovered(text, fixups):
    """Spelled tokens that would still reach a caption after the map is applied."""
    return spelled_tokens(apply_fixups(text, fixups or {}))


def _self_test():
    fails = []
    fix = {"A I": "AI", "A I driven": "AI-driven", "October twentieth": "October 20th",
           "forty five thousand eight hundred": "45,800"}
    cases = [
        ("Its C E O, Mark Sumner, calls Peru", fix, [("initialism", "C E O")]),
        ("an A I driven prospect generator", fix, []),
        ("On October twentieth, a Portland company", fix, []),
        ("On October twentieth, a Portland company", {}, [("date", "October twentieth")]),
        ("about forty five thousand eight hundred line kilometers", fix, []),
        ("over twenty five thousand line kilometers", fix, [("number", "twenty five thousand")]),
        ("A map of magnetism and two gamma ray spectrometers", {}, []),
        ("Two 2026 state airborne surveys, once around the Earth", {}, []),
        ("the U S G S and the D N R", {}, [("initialism", "U S G S"), ("initialism", "D N R")]),
        ("Plan A, I think, and USGS", {}, []),
    ]
    for text, fx, want in cases:
        got = uncovered(text, fx)
        ok = got == want
        print(f"  [{'x' if ok else ' '}] {text!r} -> {got}")
        if not ok:
            fails.append(text)
    if apply_fixups("an A I driven bit", fix) != "an AI-driven bit":
        fails.append("longest key first")
        print("  [ ] longest key first")
    else:
        print("  [x] longest key wins: 'A I driven' -> 'AI-driven', not 'AI driven'")
    print("SELF-TEST", "FAIL" if fails else "PASS")
    return 1 if fails else 0


def main():
    if "--self-test" in sys.argv:
        return _self_test()
    sp = os.path.join(OUT, "vo_script.json")
    pp = os.path.join(OUT, "episode_props.json")
    for p in (sp, pp):
        if not os.path.exists(p):
            print(f"caption_spelling_check: SKIP, {os.path.relpath(p, REPO)} does not exist yet")
            return 0

    fixups = json.load(open(sp)).get("caption_fixups", {}) or {}
    caps = json.load(open(pp)).get("captions", [])

    # Undeclared spaced initialisms fail whether or not a map exists (2026-10-22).
    spelled = [(c.get("t", c.get("start")), p, c.get("text", ""))
               for c in caps for k, p in spelled_tokens(c.get("text", "")) if k == "initialism"]
    if spelled:
        print("FAIL [caption_spelling_check] a spaced initialism is in the built captions.")
        for at, p, t in spelled:
            at = f"{at:.2f}s" if isinstance(at, (int, float)) else "?"
            print(f"  {at}  '{p}':  {t}")
        print()
        print('  Declare it in out/dispatch/vo_script.json "caption_fixups" (for example '
              '"C E O": "CEO"), then re-run:  python3 scripts/build_scenes.py')
        return 1

    if not fixups:
        print("caption_spelling_check: no caption_fixups declared and no spaced initialism "
              "in the built captions")
        return 0

    findings = []
    for c in caps:
        t = c.get("text", "")
        for wrong, right in fixups.items():
            # same boundary rule build_scenes.py applies, so the check and the transform
            # can never disagree about what counts as a hit
            if re.search(r"(?<![A-Za-z0-9])" + re.escape(wrong) + r"(?![A-Za-z0-9])", t, re.I):
                findings.append((c.get("start"), wrong, right, t))

    # ...AND ACROSS THE SEAM (2026-08-13). This checker read one cue at a time and therefore
    # agreed with a transform that also read one cue at a time, so when the chunker split
    # "N S F" into "...and N S" / "F says...", both of them saw a clean film and the phonetic
    # respelling shipped. Two tools sharing a blind spot is not two checks. Read the pair.
    for a, b in zip(caps, caps[1:]):
        seam = (a.get("text", "").rstrip() + " " + b.get("text", "").lstrip()).strip()
        for wrong, right in fixups.items():
            if len(wrong.split()) < 2:
                continue
            if re.search(r"(?<![A-Za-z0-9])" + re.escape(wrong) + r"(?![A-Za-z0-9])", seam, re.I) \
               and not re.search(r"(?<![A-Za-z0-9])" + re.escape(wrong) + r"(?![A-Za-z0-9])",
                                 a.get("text", ""), re.I):
                findings.append((a.get("start"), wrong, right,
                                 f"SPLIT ACROSS CUES: {a.get('text','')!r} + {b.get('text','')!r}"))

    if not findings:
        print(f"caption_spelling_check: clean, {len(caps)} cues carry none of the "
              f"{len(fixups)} declared respellings")
        return 0

    print("FAIL [caption_spelling_check] the built episode still carries a phonetic respelling.")
    for start, wrong, right, t in findings:
        at = f"{start:.2f}s" if isinstance(start, (int, float)) else "?"
        print(f"  {at}  '{wrong}' should read '{right}':  {t}")
    print()
    print("  episode_props.json is stale with respect to vo_script.json's caption_fixups.")
    print("  Re-run:  python3 scripts/build_scenes.py")
    return 1


if __name__ == "__main__":
    sys.exit(main())
