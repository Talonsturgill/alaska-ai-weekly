"""Quality-controlled VO synthesis for the Dispatch pipeline.

WHY THIS EXISTS: the shipped clone came out with the WRONG ACCENT. Three causes,
all fixed here:
  (a) 17 short FRAGMENTS were synthesized independently. Chatterbox drifts accent
      per generation (resemble-ai/chatterbox#267). -> synth FULL SENTENCES, never
      fragments (keep multi-sentence text together up to ~220 chars).
  (b) cfg_weight was lowered to 0.4, which weakens adherence to the reference clip.
      -> cfg_weight is 0.5 here and MUST NOT be lowered; adherence is the point.
  (c) ffmpeg atempo=1.05 time-compressed the prosody. -> NO atempo / time-stretch
      anywhere. A long script gets TRIMMED (fewer words), the audio is never squeezed.

Modeled on the Chatterbox-TTS-Extended pattern: generate N candidates with varied
seeds, VALIDATE each (Whisper transcript WER + resemblyzer speaker similarity), and
best-pick. Speaker similarity is the accent-drift killer: a drifted candidate scores
measurably lower against the owner's OWN reference clip.

RUNTIME: run under `.venv-voice/bin/python` (chatterbox, faster_whisper, resemblyzer,
torch 2.6.0+cpu all live there). Under system python the imports fail.

    from vo_qc import synth_qc
    audio, report = synth_qc("One or two full sentences of narration.")
    # audio: float32 mono @ 44100; report: {similarity, wer, attempts, warning}

    python vo_qc.py "line to speak" out.wav   # audition + print the report
"""
import os
import re
import numpy as np

# Reuse the proven normalizer + shared constants/helpers from the base backend.
from vo_backends import normalize_for_tts, REF_CLIP, SR, _ca_env

# QC DIALS — cfg_weight 0.5 is the whole point (reference adherence). DO NOT LOWER.
QC_KW = dict(exaggeration=0.5, cfg_weight=0.5, temperature=0.8)
WER_MAX = 0.15          # reject a candidate whose transcript drifts past this
SIM_FLOOR = 0.92        # ship floor for speaker similarity vs the owner's reference.
                        # CALIBRATION (owner listening test, 2026-07-15): all three approved
                        # takes scored 0.9277-0.9448, and the owner's FAVORITE was the
                        # LOWEST-similarity one (0.9277) — so similarity is a reliable FLOOR
                        # (it catches accent drift) but NOT a perceptual ranker within the
                        # passing band. Do not chase higher similarity at the cost of prosody;
                        # short punchy sentences read most naturally to the owner's ear.
MAX_CHARS = 220         # keep whole sentences together up to here; never mid-sentence
SEED_BASE = 12345       # deterministic per-candidate seeds (SEED_BASE + attempt idx)
WHISPER_SR = 16000

_state = {"model": None, "whisper": None, "encoder": None, "ref_embed": None}


# ---------------------------------------------------------------- lazy loaders
def _model():
    if _state["model"] is None:
        _ca_env()
        from chatterbox.tts import ChatterboxTTS
        _state["model"] = ChatterboxTTS.from_pretrained(device="cpu")
    return _state["model"]


def _whisper():
    if _state["whisper"] is None:
        from faster_whisper import WhisperModel
        _state["whisper"] = WhisperModel("base", device="cpu", compute_type="int8")
    return _state["whisper"]


def _encoder():
    if _state["encoder"] is None:
        from resemblyzer import VoiceEncoder
        _state["encoder"] = VoiceEncoder(verbose=False)
    return _state["encoder"]


def _ref_embed():
    """L2-normalized owner-voice embedding of the LOCKED reference clip (cached)."""
    if _state["ref_embed"] is None:
        from resemblyzer import preprocess_wav
        _state["ref_embed"] = _encoder().embed_utterance(preprocess_wav(REF_CLIP))
    return _state["ref_embed"]


# ---------------------------------------------------------------- audio helpers
def _resample(a, sr_in, sr_out):
    a = np.asarray(a, np.float32)
    if sr_in == sr_out:
        return a
    from math import gcd
    from scipy.signal import resample_poly
    g = gcd(int(sr_in), int(sr_out))
    return resample_poly(a, sr_out // g, sr_in // g).astype(np.float32)


# ---------------------------------------------------------------- validation
_WORD_RE = re.compile(r"[a-z0-9]+")


def _words(text):
    return _WORD_RE.findall(text.lower())


def _wer(ref_text, hyp_text):
    """Word-level Levenshtein / reference length. 0.0 == perfect."""
    r, h = _words(ref_text), _words(hyp_text)
    if not r:
        return 0.0 if not h else 1.0
    # DP edit distance over word tokens.
    prev = list(range(len(h) + 1))
    for i, rw in enumerate(r, 1):
        cur = [i]
        for j, hw in enumerate(h, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1,
                           prev[j - 1] + (rw != hw)))
        prev = cur
    return prev[-1] / len(r)


def _similarity(audio44100):
    """Cosine similarity of a candidate against the owner reference (both L2-norm)."""
    from resemblyzer import preprocess_wav
    emb = _encoder().embed_utterance(preprocess_wav(audio44100, source_sr=SR))
    return float(np.dot(emb, _ref_embed()))


def _transcribe(audio44100):
    seg, _ = _whisper().transcribe(_resample(audio44100, SR, WHISPER_SR),
                                   language="en", beam_size=1)
    return " ".join(s.text for s in seg).strip()


# ---------------------------------------------------------------- core
def _generate(text, seed):
    import torch
    torch.manual_seed(seed)
    wav = _model().generate(text, audio_prompt_path=REF_CLIP, **QC_KW)
    a = wav.squeeze().cpu().numpy() if hasattr(wav, "cpu") else np.asarray(wav)
    return _resample(a, _model().sr, SR)


def synth_qc(text, n_candidates=4, max_attempts=8):
    """Synthesize FULL sentence(s) with candidate generation + QC best-pick.

    Generates >= n_candidates takes (varied seeds), transcript-checks + speaker-
    similarity-scores each, and returns the highest-similarity transcript-passing
    take. If none pass WER<=0.15 within max_attempts, returns the best-similarity
    take with a warning flag set. Never fragments text, never time-stretches audio.

    Returns (audio float32 mono @ 44100, report dict).
    """
    # Voice-engine switch: DISPATCH_VOICE=gemini routes to the Gemini TTS preset-voice
    # backend (quick-start narrator, no clone). Chatterbox clone remains the default.
    if os.environ.get("DISPATCH_VOICE", "").strip().lower() == "gemini":
        import vo_gemini
        return vo_gemini.synth_qc(text)
    norm = normalize_for_tts(text)
    if len(norm) > MAX_CHARS:
        # Keep whole sentences together; only warn — do NOT chop mid-sentence and
        # never atempo. A genuinely over-long line is a SCRIPT problem to trim upstream.
        pass

    results = []
    attempts = 0
    while attempts < max_attempts:
        seed = SEED_BASE + attempts
        audio = _generate(norm, seed)
        hyp = _transcribe(audio)
        wer = _wer(norm, hyp)
        sim = _similarity(audio)
        results.append({"audio": audio, "wer": wer, "sim": sim,
                        "seed": seed, "passed": wer <= WER_MAX})
        attempts += 1
        # Stop once we've made the baseline batch AND have at least one clean take.
        if attempts >= n_candidates and any(r["passed"] for r in results):
            break

    passing = [r for r in results if r["passed"]]
    if passing:
        best = max(passing, key=lambda r: r["sim"])
        warning = None
    else:
        best = max(results, key=lambda r: r["sim"])
        warning = (f"no candidate passed WER<={WER_MAX} in {attempts} attempts; "
                   f"returned best-similarity take (wer={best['wer']:.3f})")
    if best["sim"] < SIM_FLOOR:
        warning = ((warning + " | ") if warning else "") + (
            f"similarity {best['sim']:.4f} below ship floor {SIM_FLOOR} — "
            f"likely voice/accent drift; re-roll with more candidates before shipping")

    report = {
        "similarity": round(best["sim"], 4),
        "wer": round(best["wer"], 4),
        "attempts": attempts,
        "warning": warning,
        "seed": best["seed"],
        "n_passing": len(passing),
    }
    return best["audio"], report


if __name__ == "__main__":
    import sys
    import time
    from scipy.io import wavfile
    line = sys.argv[1] if len(sys.argv) > 1 else "Alaska dot A I. Voice check."
    out = sys.argv[2] if len(sys.argv) > 2 else "vo_qc_check.wav"
    t0 = time.time()
    audio, report = synth_qc(line)
    dt = time.time() - t0
    wavfile.write(out, SR, (np.clip(audio, -1, 1) * 32767).astype(np.int16))
    report["wall_s"] = round(dt, 1)
    report["dur_s"] = round(len(audio) / SR, 2)
    print(f"wrote {out}: {report}")
