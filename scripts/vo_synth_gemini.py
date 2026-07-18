#!/usr/bin/env python3
"""EXPRESSIVE VO SYNTH (Gemini native TTS) — the delivery upgrade.

Reads out/dispatch/vo_direction.json (produced by the vo-director agent following
docs/craft/VO_DIRECTION.md): the assembled expressive prompt + the per-line spoken
script + the inline tags used. Then:

  1. Renders N takes of the WHOLE passage in ONE call each (natural sentence-to-
     sentence flow), model gemini-3.1-flash-tts-preview, voice Sulafat. Retries on
     the random 500 "text-instead-of-audio" error; fails over to
     gemini-2.5-pro-preview-tts after repeated 500s.
  2. Runs scripts/vo_soundcheck.py on every take and keeps the BEST passing one
     (word accuracy, no spoken tags, pitch-variance/expressiveness, duration,
     loudness). Writes the QC report for the Gmail draft.
  3. Force-aligns the winning take against the script to emit vo_lines.json,
     words.json and captions.json (whole-file alignment; the API has no word
     timestamps), so build_scenes.py + the caption overlay work unchanged.

Config (env, with sane defaults):
  DISPATCH_GEMINI_VOICE   default Sulafat
  DISPATCH_GEMINI_MODEL   default gemini-3.1-flash-tts-preview
  DISPATCH_GEMINI_FALLBACK default gemini-2.5-pro-preview-tts
  VO_TAKES                default 3
Requires GEMINI_API_KEY (or GOOGLE_API_KEY).
"""
import os, sys, json, base64, urllib.request, urllib.error, ssl, time, re, difflib
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import vo_soundcheck as sc

REPO = os.path.abspath(os.path.join(HERE, ".."))
OUT = os.path.join(REPO, "out", "dispatch")
AUD = os.path.join(OUT, "audio")
SR = 44100
VOICE = os.environ.get("DISPATCH_GEMINI_VOICE", "Sulafat")
MODEL = os.environ.get("DISPATCH_GEMINI_MODEL", "gemini-3.1-flash-tts-preview")
FALLBACK = os.environ.get("DISPATCH_GEMINI_FALLBACK", "gemini-2.5-pro-preview-tts")
TAKES = int(os.environ.get("VO_TAKES", "3"))
CA = os.environ.get("SSL_CERT_FILE") or "/root/.ccr/ca-bundle.crt"
CTX = ssl.create_default_context(cafile=CA) if os.path.exists(CA) else ssl.create_default_context()


def _key():
    k = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not k:
        raise SystemExit("No GEMINI_API_KEY / GOOGLE_API_KEY in env.")
    return k


def _synth_once(prompt, model, voice):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseModalities": ["AUDIO"],
                                 "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}}
    req = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST",
                                 headers={"Content-Type": "application/json", "x-goog-api-key": _key()})
    with urllib.request.urlopen(req, timeout=180, context=CTX) as r:
        resp = json.loads(r.read().decode())
    b64 = resp["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
    return np.frombuffer(base64.b64decode(b64), dtype="<i2")  # int16 @ 24k


def _synth_retry(prompt):
    """One good 24k int16 take, with 500-retry and pro fallback."""
    for model in (MODEL, FALLBACK):
        for d in (0, 4, 10, 20):
            if d:
                time.sleep(d)
            try:
                pcm = _synth_once(prompt, model, VOICE)
                if len(pcm) > 24000 * 2:  # at least ~2s of audio
                    return pcm, model
            except urllib.error.HTTPError as e:
                if e.code in (429, 500, 503):
                    continue
                raise
            except Exception:
                continue
        print(f"  {model} exhausted; failing over" if model == MODEL else f"  {FALLBACK} exhausted")
    raise RuntimeError("Gemini TTS failed on both models after retries.")


def _save_24k(pcm_i16, path):
    from scipy.io import wavfile
    wavfile.write(path, 24000, pcm_i16)


def _to_44k_int16(pcm_i16):
    a = pcm_i16.astype(np.float32) / 32768.0
    from math import gcd
    from scipy.signal import resample_poly
    g = gcd(24000, SR)
    a = resample_poly(a, SR // g, 24000 // g)
    return (np.clip(a, -1, 1) * 32767).astype(np.int16)


# ------------------------------------------------------------------ alignment
def _align_wholefile(wav24, lines):
    """Whisper word-timestamps on the whole take -> per-line spans + word list +
    caption cues. Mirrors dispatch_captions but over one file."""
    from faster_whisper import WhisperModel
    m = WhisperModel("small", device="cpu", compute_type="int8")
    segs, _ = m.transcribe(wav24, word_timestamps=True, language="en", vad_filter=False,
                           initial_prompt=" ".join(lines)[:220])
    heard = []
    for s in segs:
        for w in (s.words or []):
            heard.append({"w": w.word.strip(), "s": float(w.start), "e": float(w.end)})
    intended = []            # (line_idx, token)
    for i, ln in enumerate(lines):
        for tok in ln.split():
            intended.append((i, tok))
    inn = [sc._norm_words(t)[0] if sc._norm_words(t) else "" for _, t in intended]
    hn = [sc._norm_words(x["w"])[0] if sc._norm_words(x["w"]) else "" for x in heard]
    sm = difflib.SequenceMatcher(a=inn, b=hn, autojunk=False)
    timed = [None] * len(intended)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                timed[i1 + k] = (heard[j1 + k]["s"], heard[j1 + k]["e"])
        elif tag in ("replace", "delete"):
            hs = heard[j1]["s"] if j1 < len(heard) else (heard[-1]["e"] if heard else 0)
            he = heard[j2 - 1]["e"] if 0 < j2 <= len(heard) and j2 > j1 else hs
            n = max(1, i2 - i1)
            for k in range(i1, i2):
                timed[k] = (hs + (he - hs) * k / n, hs + (he - hs) * (k + 1) / n)
    for k in range(len(timed)):
        if timed[k] is None:
            prev = next((timed[j] for j in range(k - 1, -1, -1) if timed[j]), None)
            nxt = next((timed[j] for j in range(k + 1, len(timed)) if timed[j]), None)
            timed[k] = (prev[1], nxt[0]) if prev and nxt else (prev or nxt or (0.0, 0.25))
    words = [{"w": tok, "s": round(timed[n][0], 3), "e": round(max(timed[n][0] + 0.04, timed[n][1]), 3),
              "seg": li} for n, (li, tok) in enumerate(intended)]
    # per-line spans
    line_spans = []
    for i, ln in enumerate(lines):
        ws = [w for w in words if w["seg"] == i]
        if ws:
            line_spans.append({"idx": i, "text": ln, "start": ws[0]["s"], "end": ws[-1]["e"]})
    total = max(w["e"] for w in words)
    # caption cues (sentence/length break, anti-orphan)
    cues, cur = [], []
    for w in words:
        cur.append(w)
        j = " ".join(x["w"] for x in cur)
        if re.search(r"[.!?]$", w["w"]) or len(j) >= 30 or len(cur) >= 6 or cur[0]["seg"] != w["seg"]:
            cues.append({"text": " ".join(x["w"] for x in cur), "start": cur[0]["s"],
                         "end": cur[-1]["e"], "seg": cur[0]["seg"]}); cur = []
    if cur:
        cues.append({"text": " ".join(x["w"] for x in cur), "start": cur[0]["s"],
                     "end": cur[-1]["e"], "seg": cur[0]["seg"]})
    # enforce monotonic, non-overlapping, min-dwell cue timing for readable display
    MIN_CUE, GAP = 0.7, 0.03
    for i in range(len(cues)):
        nxt = cues[i + 1]["start"] if i + 1 < len(cues) else cues[i]["end"] + MIN_CUE + 1
        if i > 0:
            cues[i]["start"] = max(cues[i]["start"], cues[i - 1]["end"] + GAP)
        cues[i]["start"] = min(cues[i]["start"], max(0.0, nxt - 0.2))
        cues[i]["end"] = min(max(cues[i]["end"], cues[i]["start"] + MIN_CUE), max(cues[i]["start"] + 0.2, nxt - GAP))
    return words, line_spans, total, cues


def _strip_tags(s):
    """Remove [inline tags] — they're for the TTS prompt, never for captions/display."""
    return re.sub(r"\s+", " ", re.sub(r"\[[^\]]*\]", "", s)).strip()


def main():
    os.makedirs(AUD, exist_ok=True)
    plan = json.load(open(os.path.join(OUT, "vo_direction.json")))
    prompt = plan["assembled_prompt"]
    lines = [_strip_tags(l["text"]) for l in plan["lines"]]  # SPOKEN words only (no tags)
    spoken = " ".join(lines)
    tags = sorted({t for l in plan["lines"] for t in l.get("tags", [])})

    takes = []
    for n in range(TAKES):
        pcm, used = _synth_retry(prompt)
        p = os.path.join(AUD, f"vo_take_{n}.wav")
        _save_24k(pcm, p)
        takes.append((p, used))
        print(f"take {n}: {len(pcm)/24000:.1f}s ({used})")

    best_i, reports = sc.pick_best([p for p, _ in takes], spoken, tags)
    best_wav, best_model = takes[best_i]
    print(f"BEST take {best_i} ({best_model}): {reports[best_i]['diagnosis']}  score={reports[best_i]['score']}")

    # write the winning VO at 44.1k for the pipeline
    from scipy.io import wavfile
    _, pcm24 = wavfile.read(best_wav)
    wavfile.write(os.path.join(AUD, "vo.wav"), SR, _to_44k_int16(pcm24))

    # align the winning take -> timings for scenes + captions
    words, line_spans, total, cues = _align_wholefile(best_wav, lines)
    json.dump({"words": words, "speech_end": round(total, 3), "total": 60.0, "fps": 30},
              open(os.path.join(AUD, "words.json"), "w"), indent=2)
    json.dump({"total": round(total, 3), "voice": VOICE, "model": best_model, "lines": line_spans},
              open(os.path.join(OUT, "vo_lines.json"), "w"), indent=2)
    json.dump(cues, open(os.path.join(OUT, "captions.json"), "w"), indent=2)
    json.dump({"backend": "gemini-tts", "model": best_model, "voice": VOICE, "take": best_i,
               "takes": TAKES, "soundcheck": reports[best_i],
               "all_reports": [{"pass": r["pass"], "score": r["score"], "diagnosis": r["diagnosis"]} for r in reports],
               "watermark": "SynthID (Google) embedded in all Gemini TTS audio",
               "license": "Google Gemini API preset voice (per-use billing)"},
              open(os.path.join(OUT, "vo_report.json"), "w"), indent=2)
    print(f"wrote vo.wav ({total:.1f}s), vo_lines.json ({len(line_spans)} lines), captions.json ({len(cues)} cues), vo_report.json")

    # acting data (mouth envelope + emphasis accents) always tracks the shipped take
    import vo_envelope
    vo_envelope.main()


if __name__ == "__main__":
    main()
