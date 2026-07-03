"""60s Dispatch VO -- Kokoro (publish voice, Apache-2.0), with REAL per-word timestamps from the
model's own duration predictor (join_timestamps), so captions are sample-accurate to the actual
audio (no forced alignment needed). Segments are laid on a 60s timeline with LEAD/GAP spacing,
matching the schema vo60.py (edge-tts engine) produces so dispatch_core.py can consume either.

Writes (relative to this file's directory):
  audio/vo60.wav        the 60s VO bed (stereo, -1.5 dBTP normalized)
  audio/timing60.json   segment starts/beats/durs/speech_end (audio mix + scene beats)
  audio/words60.json    global word list [{w,s,e,seg}] for kinetic captions

Usage: python vo60_kokoro.py   (edit SEG + VOICE below per story)
"""
import os, json, warnings
import numpy as np
from scipy.io import wavfile

warnings.filterwarnings("ignore")
HERE = os.path.dirname(os.path.abspath(__file__))
AUD = os.path.join(HERE, "audio")
os.makedirs(AUD, exist_ok=True)

VOICE = "am_fenrir"         # kokoro:am_fenrir -- deep, authoritative; fits a watching, big-systems story
SR = 24000                  # kokoro native sample rate
FPS = 30
LEAD = 0.40
GAP = 0.24
TOTAL = 60.0

# ---- STORY VO SCRIPT (~137 words, ~60s at natural pace) ----
# XPRIZE Wildfire autonomous-drone finals, Nenana AK, June 15-25 2026, ACUASI/UAF test range.
# NO em dashes or en dashes anywhere. Ranges as "X to Y". Phonetic numbers/acronyms.
SEG = [
    "An hour outside Fairbanks, in Nenana, Alaska, someone lit a fire on command.",
    "No firefighter answered it. A machine did.",
    "The University of Alaska Fairbanks ran the range, through its drone research center, ACUASI.",
    "Three finalist teams flew their systems into a one thousand square kilometer test box. Anduril's towers and drones. Dryad's solar powered sensor web. AURA Foresight's watching swarm.",
    "Each had ten minutes to find the fire and put it out. No human in the loop.",
    "Three and a half million dollars is riding on whoever does it best.",
    "But notice the limit. This fire was lit on cue, inside a box XPRIZE drew.",
    "Nobody has announced a winner. And nobody has pointed these systems at a fire that wasn't invited.",
    "Alaska's real fire season is what asks that question next.",
]

# ---- NUMERAL SUBSTITUTIONS (on-screen captions show numerals, never spelled-out; VO stays phonetic) ----
# Each entry: (segment_index 1-based, [consecutive spoken words to match, lowercase, no punctuation], display_string)
# A multi-word match MERGES into one caption token spanning the combined start/end time (anti-orphan:
# a spelled-out number run never gets split across two caption lines).
NUMERAL_SUBS = [
    (4, ["one", "thousand", "square", "kilometer"], "1,000 km²"),
    (5, ["ten"], "10"),
    (6, ["three", "and", "a", "half", "million", "dollars"], "$3.5M"),
]


def synth_segment(pipeline, text):
    """Returns (audio: float32 mono @24k, words: list[{w,s,e}])."""
    chunks = []
    words = []
    t_off = 0.0
    for result in pipeline(text, voice=VOICE):
        a = result.output.audio
        a = a.numpy() if hasattr(a, "numpy") else np.asarray(a)
        chunks.append(a)
        if result.tokens:
            for tok in result.tokens:
                w = (tok.text or "").strip()
                s = getattr(tok, "start_ts", None)
                e = getattr(tok, "end_ts", None)
                if w and s is not None and e is not None:
                    words.append({"w": w, "s": round(t_off + s, 3), "e": round(t_off + e, 3)})
        t_off += len(a) / SR
    audio = np.concatenate(chunks) if chunks else np.zeros(0, np.float32)
    return audio, words


def _norm(w):
    return "".join(c for c in w.lower() if c.isalnum() or c == "'")


def apply_numeral_subs(seg_idx, words):
    """Merge/relabel spoken-number word runs into numeral display tokens for on-screen captions.
    VO audio is untouched (it always speaks the phonetic form); only the display text + token
    grouping for words60.json changes, so captions read numerals per the on-screen-copy rule."""
    subs = [s for s in NUMERAL_SUBS if s[0] == seg_idx]
    if not subs:
        return words
    out = list(words)
    for _, match, display in subs:
        norm_match = [_norm(m) for m in match]
        n = len(norm_match)
        for i in range(len(out) - n + 1):
            if [_norm(out[i + k]["w"]) for k in range(n)] == norm_match:
                merged = {"w": display, "s": out[i]["s"], "e": out[i + n - 1]["e"]}
                out = out[:i] + [merged] + out[i + n:]
                break
    return out


PUNCT = set(".,!?;:")


def chunk_into_phrases(words, max_words=6):
    """dispatch_core.caption() expects PHRASE-level cues (cue['w'].split() renders the whole cue
    progressively), not one cue per word. Fold standalone punctuation onto the prior word, then
    group into ~max_words chunks, always breaking at sentence-ending punctuation."""
    folded = []
    for w in words:
        if all(c in PUNCT for c in w["w"]) and folded:
            folded[-1] = {**folded[-1], "w": folded[-1]["w"] + w["w"], "e": w["e"]}
        else:
            folded.append(dict(w))
    chunks = []
    cur = []
    for w in folded:
        cur.append(w)
        ends_sentence = w["w"].rstrip()[-1:] in (".", "!", "?") if w["w"].rstrip() else False
        if ends_sentence or len(cur) >= max_words:
            chunks.append(cur)
            cur = []
    if cur:
        chunks.append(cur)
    return [{"w": " ".join(x["w"] for x in c), "s": c[0]["s"], "e": c[-1]["e"]} for c in chunks]


def main():
    from kokoro import KPipeline
    pipeline = KPipeline(lang_code="a")

    durs = []
    clips = []
    segwords = []
    for i, t in enumerate(SEG, 1):
        audio, words = synth_segment(pipeline, t)
        words = apply_numeral_subs(i, words)
        durs.append(len(audio) / SR)
        clips.append(audio)
        segwords.append(words)
        print(f"s{i}: {durs[-1]:.2f}s  words={len(words)}")

    N = int(TOTAL * SR)
    buf = np.zeros(N, np.float32)
    t = LEAD
    beats = []
    starts = []
    words_out = []
    for i, c in enumerate(clips):
        s = int(t * SR)
        starts.append(round(t, 3))
        beats.append(round(t * FPS))
        e = min(s + len(c), N)
        buf[s:e] += c[: e - s]
        for cue in chunk_into_phrases(segwords[i]):
            words_out.append({"w": cue["w"], "s": round(t + cue["s"], 3), "e": round(t + cue["e"], 3), "seg": i})
        t += durs[i] + GAP
    speech_end = t - GAP
    print("speech_end", round(speech_end, 2), "beats", beats, "words", len(words_out))

    buf = buf / (np.max(np.abs(buf)) + 1e-9) * (10 ** (-1.5 / 20))
    # resample 24k -> 44.1k for downstream ffmpeg mix consistency
    import subprocess, tempfile
    tmp_in = tempfile.mktemp(suffix=".wav")
    wavfile.write(tmp_in, SR, (buf * 32767).astype(np.int16))
    out_wav = os.path.join(AUD, "vo60.wav")
    subprocess.run(["ffmpeg", "-y", "-i", tmp_in, "-ac", "2", "-ar", "44100", out_wav],
                    check=True, capture_output=True)
    os.remove(tmp_in)

    json.dump(
        {"starts": starts, "beats": beats, "durs": durs, "speech_end": speech_end, "total": TOTAL, "fps": FPS},
        open(os.path.join(AUD, "timing60.json"), "w"), indent=2,
    )
    json.dump(
        {"words": words_out, "speech_end": speech_end, "total": TOTAL, "fps": FPS},
        open(os.path.join(AUD, "words60.json"), "w"), indent=2,
    )
    print("wrote vo60.wav, timing60.json, words60.json")


if __name__ == "__main__":
    main()
