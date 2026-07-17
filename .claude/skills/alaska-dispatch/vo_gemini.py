"""Gemini TTS backend for the Dispatch VO — a PRESET-voice option (not a clone).

Quick-start narrator voice while the owner's cloned voice (Chatterbox / later
ElevenLabs) is set up separately. Drop-in for vo_qc.synth_qc: returns
(float32 mono @ 44100, report). No speaker-similarity gate applies because this
is a prebuilt Google voice, not the owner's voice — the report says so plainly.

SETUP (do this once, in the routine env at claude.ai/code/routines):
  1. Get a Gemini API key: https://aistudio.google.com/apikey
  2. Set env var  GEMINI_API_KEY = <your key>   (GOOGLE_API_KEY also accepted)
  3. Set env var  DISPATCH_VOICE = gemini        (flips the whole pipeline to this backend)
  4. Make sure the routine's network policy allows  generativelanguage.googleapis.com
Optional env:
  DISPATCH_GEMINI_TTS_MODEL   default gemini-2.5-flash-preview-tts
  DISPATCH_GEMINI_VOICE       default Charon  (calm, informative; 30 voices, see docs)
  DISPATCH_GEMINI_STYLE       optional style instruction, e.g. "in a calm, factual news tone"

Audition:  python vo_gemini.py "One or two full sentences." out.wav
"""
import os, sys, json, base64, urllib.request, urllib.error
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from vo_backends import normalize_for_tts, SR  # SR = 44100; shared number/text normalizer

MODEL = os.environ.get("DISPATCH_GEMINI_TTS_MODEL", "gemini-2.5-flash-preview-tts")
VOICE = os.environ.get("DISPATCH_GEMINI_VOICE", "Charon")
STYLE = os.environ.get("DISPATCH_GEMINI_STYLE", "").strip()
PCM_RATE = 24000  # Gemini TTS returns signed 16-bit PCM, mono, 24 kHz


def _api_key():
    k = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not k:
        raise RuntimeError(
            "No GEMINI_API_KEY (or GOOGLE_API_KEY) in the environment. Set it in the routine env "
            "at claude.ai/code/routines, then set DISPATCH_VOICE=gemini.")
    return k


def _resample_to_sr(pcm_i16):
    """int16 PCM @ 24kHz -> float32 mono @ 44100."""
    a = (pcm_i16.astype(np.float32)) / 32768.0
    if PCM_RATE != SR:
        from math import gcd
        from scipy.signal import resample_poly
        g = gcd(PCM_RATE, SR)
        a = resample_poly(a, SR // g, PCM_RATE // g).astype(np.float32)
    return a


def synth(text):
    """Synthesize one or two whole sentences -> float32 mono @ 44100."""
    spoken = normalize_for_tts(text)
    prompt = f"Say {STYLE}: {spoken}" if STYLE else spoken
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": VOICE}}},
        },
    }
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST", headers={
        "Content-Type": "application/json",
        "x-goog-api-key": _api_key(),
    })
    # honor the container's proxy CA bundle when present (agent proxy), else default TLS
    ca = os.environ.get("SSL_CERT_FILE") or "/root/.ccr/ca-bundle.crt"
    import ssl
    ctx = ssl.create_default_context(cafile=ca) if os.path.exists(ca) else ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, timeout=120, context=ctx) as r:
            resp = json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Gemini TTS HTTP {e.code}: {e.read().decode('utf-8', 'ignore')[:500]}")
    try:
        b64 = resp["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
    except (KeyError, IndexError):
        raise RuntimeError(f"Gemini TTS: no audio in response: {json.dumps(resp)[:500]}")
    pcm = np.frombuffer(base64.b64decode(b64), dtype="<i2")
    return _resample_to_sr(pcm)


def synth_qc(text, **_ignored):
    """Drop-in for vo_qc.synth_qc. Returns (audio, report). No similarity gate:
    this is a prebuilt Google voice, not the owner's clone."""
    audio = synth(text)
    report = {
        "similarity": None, "wer": 0.0, "attempts": 1,
        "backend": "gemini-tts", "model": MODEL, "voice": VOICE,
        "warning": "PRESET Gemini voice (not the owner's cloned voice) — no speaker-similarity gate applies.",
    }
    return audio, report


def backend_report():
    return {"backend": "gemini-tts", "voice": f"{MODEL}/{VOICE}",
            "license": "Google Gemini API (preset voice; per-use billing)"}


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("usage: python vo_gemini.py \"text to speak\" out.wav", file=sys.stderr)
        sys.exit(2)
    from scipy.io import wavfile
    a = synth(sys.argv[1])
    wavfile.write(sys.argv[2], SR, (np.clip(a, -1, 1) * 32767).astype(np.int16))
    print(f"wrote {sys.argv[2]}  {len(a)/SR:.2f}s  model={MODEL} voice={VOICE}")
