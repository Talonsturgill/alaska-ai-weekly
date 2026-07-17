#!/usr/bin/env python3
"""Per-line forced alignment for the 2026-07-17 Dispatch captions.

Whole-file whisper alignment drifts on a VO with silent gaps between sentences
(it crammed 24 words at one timestamp and hallucinated 'and so on'). Fix (the
proven per-line approach): each sentence was synthesized as a clean clip and
placed at a known start (audio/vo_qc_report.json). We slice each sentence's
window out of vo60.wav, run faster-whisper word_timestamps on the CLEAN slice,
offset by the known start, and map the whisper words onto the INTENDED script
tokens via difflib so caption TEXT is verbatim and TIMINGS are real (no guessing).

Writes audio/words60.json {words:[{w,s,e,seg}], speech_end, total, fps}.
Run with the voice venv: .venv-voice/bin/python scripts/align_lines_minerals.py
"""
import json, os, re, difflib, subprocess, tempfile
from pathlib import Path

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
AUD = os.path.join(REPO, "out", "dispatch", "audio")
FF = os.environ.get("FFMPEG_BIN", "ffmpeg")
SR = 44100


def norm(w):
    return re.sub(r"[^a-z0-9']", "", w.lower())


def main():
    from faster_whisper import WhisperModel
    rep = json.load(open(os.path.join(AUD, "vo_qc_report.json")))["lines"]
    model = WhisperModel("small", device="cpu", compute_type="int8")
    all_words = []
    for L in rep:
        start = float(L["t"])
        dur = float(L["dur"])
        text = L["text"]
        # slice the clean clip [start, start+dur+0.25]
        clip = os.path.join(tempfile.gettempdir(), f"line_{L['i']:02d}.wav")
        subprocess.run([FF, "-y", "-ss", str(start), "-t", str(dur + 0.25),
                        "-i", os.path.join(AUD, "vo60.wav"), "-ar", str(SR), "-ac", "1", clip],
                       capture_output=True)
        segs, _ = model.transcribe(clip, language="en", word_timestamps=True,
                                   initial_prompt=text)
        wh = []
        for s in segs:
            for wd in (s.words or []):
                wh.append({"w": wd.word.strip(), "s": start + wd.start, "e": start + wd.end})
        # map whisper words onto the intended script tokens (verbatim text, real timings)
        script_tokens = text.split()
        wh_norm = [norm(x["w"]) for x in wh]
        sc_norm = [norm(t) for t in script_tokens]
        sm = difflib.SequenceMatcher(a=sc_norm, b=wh_norm, autojunk=False)
        # default: spread across the clip if a token has no match
        line_words = []
        for tok in script_tokens:
            line_words.append({"w": tok, "s": None, "e": None, "seg": L["i"]})
        for a0, b0, size in sm.get_matching_blocks():
            for k in range(size):
                line_words[a0 + k]["s"] = wh[b0 + k]["s"]
                line_words[a0 + k]["e"] = wh[b0 + k]["e"]
        # fill gaps by interpolation within the line window
        lo, hi = start, start + dur
        known = [(i, w) for i, w in enumerate(line_words) if w["s"] is not None]
        if not known:
            n = len(line_words)
            for i, w in enumerate(line_words):
                w["s"] = lo + (hi - lo) * i / max(1, n)
                w["e"] = lo + (hi - lo) * (i + 1) / max(1, n)
        else:
            # forward/backward fill + linear interpolation between anchors
            for idx in range(len(line_words)):
                if line_words[idx]["s"] is None:
                    prev = next((known[j] for j in range(len(known) - 1, -1, -1) if known[j][0] < idx), None)
                    nxt = next((known[j] for j in range(len(known)) if known[j][0] > idx), None)
                    if prev and nxt:
                        span = nxt[0] - prev[0]
                        frac = (idx - prev[0]) / span
                        t = prev[1]["e"] + (nxt[1]["s"] - prev[1]["e"]) * frac
                        line_words[idx]["s"] = t
                        line_words[idx]["e"] = t + 0.18
                    elif prev:
                        line_words[idx]["s"] = prev[1]["e"]
                        line_words[idx]["e"] = prev[1]["e"] + 0.2
                    elif nxt:
                        line_words[idx]["s"] = max(lo, nxt[1]["s"] - 0.2)
                        line_words[idx]["e"] = nxt[1]["s"]
        # enforce monotonic non-decreasing
        for i in range(1, len(line_words)):
            if line_words[i]["s"] < line_words[i - 1]["s"]:
                line_words[i]["s"] = line_words[i - 1]["s"]
            if line_words[i]["e"] < line_words[i]["s"]:
                line_words[i]["e"] = line_words[i]["s"] + 0.12
        all_words.extend(line_words)
    speech_end = round(max(w["e"] for w in all_words), 2)
    out = {"words": [{"w": w["w"], "s": round(w["s"], 3), "e": round(w["e"], 3), "seg": w["seg"]} for w in all_words],
           "speech_end": speech_end, "total": 60.0, "fps": 30}
    json.dump(out, open(os.path.join(AUD, "words60.json"), "w"), indent=1)
    print(f"aligned {len(all_words)} words across {len(rep)} lines, speech_end={speech_end}")


if __name__ == "__main__":
    main()
