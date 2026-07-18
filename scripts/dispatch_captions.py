#!/usr/bin/env python3
"""Deterministic caption timings for the Dispatch.

Whole-file whisper alignment drifted badly on the assembled VO. Fix: we
synthesized PER LINE, so each line's [start,end] on the timeline is exact
(from real audio duration, vo_lines.json). We align EACH short line clip
(2-7s, clean) with faster-whisper word_timestamps, offset by the known line
start, then map those timings onto our INTENDED script tokens via a difflib
alignment so caption TEXT is verbatim-correct and TIMINGS are forced-aligned.

Outputs:
  out/dispatch/audio/words.json  {"words":[{w,s,e,seg}], "speech_end","total","fps"}
  out/dispatch/captions.json     [{"text","start","end","seg"}] readable cues
"""
import json, os, re, difflib
from pathlib import Path

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, ".."))
OUT = os.path.join(REPO, "out", "dispatch")
AUD = os.path.join(OUT, "audio")
FPS = 30
MAX_CHARS = 30   # per caption cue
MAX_WORDS = 6


def norm(w):
    return re.sub(r"[^a-z0-9']", "", w.lower())


def main():
    from faster_whisper import WhisperModel
    lines_meta = json.load(open(os.path.join(OUT, "vo_lines.json")))
    script = json.load(open(os.path.join(OUT, "vo_script.json")))["lines"]
    model = WhisperModel("small", device="cpu", compute_type="int8")

    all_words = []          # {w,s,e,seg}
    for meta in lines_meta["lines"]:
        i = meta["idx"]
        wav = os.path.join(AUD, f"vo_line_{i:02d}.wav")
        seg_start = meta["start"]
        seg_end = meta["end"]
        intended = script[i].split()
        inn = [norm(t) for t in intended]

        # faster-whisper occasionally drops a whole leading/trailing span of a short clip's
        # words on a given call (confirmed: a clean standalone re-transcription of the same
        # wav recovers them fine) -- when that happens difflib maps the dropped intended words
        # to a zero-width heard gap, collapsing them to one instant. Retry a few times and keep
        # the attempt with the least "gap" damage instead of trusting the first pass blindly.
        best = None
        for attempt in range(3):
            segs, _ = model.transcribe(wav, word_timestamps=True, language="en",
                                       initial_prompt=script[i][:180], vad_filter=False)
            heard = []
            for s in segs:
                for w in (s.words or []):
                    heard.append({"w": w.word.strip(), "s": w.start, "e": w.end})
            hn = [norm(x["w"]) for x in heard]
            sm = difflib.SequenceMatcher(a=inn, b=hn, autojunk=False)
            opcodes = sm.get_opcodes()
            gap_words = sum(i2 - i1 for tag, i1, i2, j1, j2 in opcodes
                            if tag in ("replace", "delete") and j2 == j1)
            if best is None or gap_words < best[0]:
                best = (gap_words, heard, opcodes)
            if gap_words == 0:
                break
        _, heard, opcodes = best

        timed = [None] * len(intended)
        for tag, i1, i2, j1, j2 in opcodes:
            if tag == "equal":
                for k in range(i2 - i1):
                    h = heard[j1 + k]
                    timed[i1 + k] = (h["s"], h["e"])
            elif tag in ("replace", "delete", "insert"):
                # map intended span [i1,i2) proportionally over heard span [j1,j2)
                if tag == "insert":
                    continue
                hs = heard[j1]["s"] if j1 < len(heard) else (heard[-1]["e"] if heard else 0)
                he = heard[j2 - 1]["e"] if (j2 - 1) < len(heard) and j2 > j1 else hs
                n = max(1, i2 - i1)
                for k in range(i1, i2):
                    frac0 = (k - i1) / n
                    frac1 = (k - i1 + 1) / n
                    timed[k] = (hs + (he - hs) * frac0, hs + (he - hs) * frac1)
        # fill any remaining None by interpolation across the line
        for k in range(len(timed)):
            if timed[k] is None:
                prev = next((timed[j] for j in range(k - 1, -1, -1) if timed[j]), None)
                nxt = next((timed[j] for j in range(k + 1, len(timed)) if timed[j]), None)
                if prev and nxt:
                    timed[k] = (prev[1], nxt[0])
                elif prev:
                    timed[k] = (prev[1], prev[1] + 0.25)
                elif nxt:
                    timed[k] = (max(0, nxt[0] - 0.25), nxt[0])
                else:
                    timed[k] = (0.0, 0.25)
        # clamp within [0, line_dur] and offset to timeline
        # (reserve 0.04s of headroom on s so e can never collapse onto s when the
        # heard timestamp lands at or past line_dur -- that produced zero-duration
        # cues on trailing words, e.g. "land." at s=e=line_dur)
        line_dur = seg_end - seg_start
        for tok, tm in zip(intended, timed):
            s = min(max(0.0, tm[0]), max(0.0, line_dur - 0.04))
            e = min(max(s + 0.04, tm[1]), line_dur)
            all_words.append({"w": tok, "s": round(seg_start + s, 3),
                              "e": round(seg_start + e, 3), "seg": i})

    speech_end = max(w["e"] for w in all_words)
    words_doc = {"words": all_words, "speech_end": round(speech_end, 3),
                 "total": 60.0, "fps": FPS}
    json.dump(words_doc, open(os.path.join(AUD, "words.json"), "w"), indent=2)

    # build readable caption cues (anti-orphan, break on sentence punctuation)
    cues = []
    cur = []
    def flush():
        if not cur:
            return
        text = " ".join(w["w"] for w in cur)
        cues.append({"text": text, "start": cur[0]["s"], "end": cur[-1]["e"],
                     "seg": cur[0]["seg"]})
        cur.clear()
    for w in all_words:
        cur.append(w)
        joined = " ".join(x["w"] for x in cur)
        ends_sentence = bool(re.search(r"[.!?]$", w["w"]))
        if ends_sentence or len(joined) >= MAX_CHARS or len(cur) >= MAX_WORDS \
           or (cur[0]["seg"] != w["seg"]):
            flush()
    flush()
    # never leave a 1-word orphan cue: merge into previous
    merged = []
    for c in cues:
        if merged and len(c["text"].split()) == 1 and c["seg"] == merged[-1]["seg"]:
            merged[-1]["text"] += " " + c["text"]
            merged[-1]["end"] = c["end"]
        else:
            merged.append(c)
    json.dump(merged, open(os.path.join(OUT, "captions.json"), "w"), indent=2)
    print(f"words={len(all_words)} speech_end={speech_end:.2f}s cues={len(merged)}")
    # quick sanity: monotonic starts?
    bad = sum(1 for a, b in zip(all_words, all_words[1:]) if b["s"] + 0.001 < a["s"])
    print(f"non-monotonic word starts: {bad}")


if __name__ == "__main__":
    main()
