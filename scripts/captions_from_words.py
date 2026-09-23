#!/usr/bin/env python3
"""Turn a forced-alignment WORDS file into the CUE file build_scenes.py reads.

WHY THIS EXISTS (2026-09-23). The Gemini VO pipeline writes two different things
into out/dispatch/: words.json, which is word-level alignment, and captions.json,
which is a list of CUES shaped {start, end, text, seg}. Everything downstream
reads the cue file.

The edge-tts fallback does not produce either. scripts/align_captions.py fills the
gap and writes {"words": [...], "speech_end": ..., "total": ..., "fps": ...}, which
is the WORDS shape under the CAPTIONS name. Feeding that to build_scenes.py fails
deep inside the cue rebalancer with `KeyError: 1`, because it indexes a list and
gets a dict. The error names nothing useful and the failure is three layers from
the cause.

So the fallback path was missing its last link, and this is that link. One cue per
VO line, which is the unit the rest of the pipeline is anchored to: `seg` is the VO
line index, and build_scenes' own rebalancer re-chunks anything too long for the
caption band. Timing comes from the ALIGNED AUDIO, never from the script, per
DISPATCH_STANDARD section 5: caption text comes from the script, caption timing
comes from the audio.

    python3 scripts/captions_from_words.py            # words.json -> captions.json
"""
import argparse
import json
import os
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(REPO, "out", "dispatch")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--words", default=os.path.join(OUT, "captions.json"),
                    help="the forced-alignment output (the {words:[...]} shape)")
    ap.add_argument("--lines", default=os.path.join(OUT, "vo_lines.json"))
    ap.add_argument("--out", default=os.path.join(OUT, "captions.json"))
    ap.add_argument("--script", default=os.path.join(OUT, "vo_script.json"),
                    help="the locked script, which carries the DISPLAY spelling of each line")
    a = ap.parse_args()

    doc = json.load(open(a.words))
    if isinstance(doc, list):
        print(f"captions_from_words: {a.words} is already a cue list, nothing to do")
        return 0
    words = doc.get("words") or []
    if not words:
        print("FAIL captions_from_words: no words in the alignment file")
        return 1

    lines = json.load(open(a.lines))["lines"]

    # THE SCRIPT IS PHONETIC FOR THE SYNTH AND NUMERIC ON SCREEN. The locked
    # script spells numbers and acronyms the way the voice must SAY them ("four
    # thousand seven hundred", "A I", "F thirty fives") because that is what the
    # transcript gate scores. A caption is READ, so it takes the numeral form.
    # Lines carry an optional `display` for exactly this, and without it the
    # rough cut burned "about four thousand seven hundred acres" on screen.
    display = {}
    try:
        for l in json.load(open(a.script))["lines"]:
            display[l["idx"]] = l.get("display") or l["text"]
    except Exception as e:
        print(f"  NOTE: could not read {a.script} ({e}); falling back to stem text")

    # CAPTION TEXT COMES FROM THE SCRIPT. CAPTION TIMING COMES FROM THE AUDIO.
    # DISPATCH_STANDARD section 5, and the first build of this script broke it.
    # It joined the ASR's own words into the cue text, which burned the
    # transcriber's mistakes onto the screen: the rough cut rendered "Eielson" as
    # "Isle -San", "hum" as "home", and split "4,700" across a space. Those are
    # ASR errors, not script errors, and a viewer reads them as the film being
    # wrong about a real place. The aligner exists to place words IN TIME and for
    # nothing else.
    #
    # So each cue carries the SCRIPT line verbatim, and takes its start and end
    # from the aligned words that fall inside that line's measured span.
    buckets = {l["idx"]: [] for l in lines}
    for w in words:
        mid = (float(w["s"]) + float(w["e"])) / 2.0
        hit = None
        for l in lines:
            if l["start"] <= mid <= l["end"]:
                hit = l["idx"]
                break
        if hit is None:
            hit = min(lines, key=lambda l: min(abs(mid - l["start"]), abs(mid - l["end"])))["idx"]
        buckets[hit].append(w)

    cues, empty = [], []
    for l in lines:
        ws = buckets[l["idx"]]
        if ws:
            start = round(min(float(w["s"]) for w in ws), 3)
            end = round(max(float(w["e"]) for w in ws), 3)
        else:
            # no aligned words landed here, so fall back to the line's own
            # measured span rather than dropping the caption entirely
            empty.append(l["idx"])
            start, end = round(float(l["start"]), 3), round(float(l["end"]), 3)
        txt = display.get(l["idx"], l["text"])
        cues.append({"start": start, "end": end, "text": txt.strip(), "seg": l["idx"]})
    cues.sort(key=lambda c: c["start"])

    # monotonic, non-overlapping, which the caption renderer assumes
    for i in range(1, len(cues)):
        if cues[i]["start"] < cues[i - 1]["end"]:
            cues[i]["start"] = cues[i - 1]["end"]
        if cues[i]["end"] <= cues[i]["start"]:
            cues[i]["end"] = cues[i]["start"] + 0.35

    json.dump(cues, open(a.out, "w"), indent=2)
    print(f"captions_from_words: {len(words)} aligned words placed {len(cues)} SCRIPT cues over "
          f"{len(lines)} VO lines, last ends {cues[-1]['end']:.2f}s -> {a.out}")
    if empty:
        print(f"  NOTE: {len(empty)} VO line(s) got no aligned words: {empty}. "
              f"That is a real alignment gap, not a formatting one, and those lines "
              f"will have no caption on screen. Check the stem before shipping.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
