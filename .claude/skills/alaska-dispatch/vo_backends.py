"""Shared VO synthesis backends for the Dispatch pipeline.

Priority order (config/voices.yaml):
  1. cloned   — Chatterbox zero-shot clone of the owner's committed reference clip
                (assets/voice/talon_ref.wav). MIT license, commercial OK, output carries
                Resemble's imperceptible Perth watermark (disclose in credits).
  2. kokoro   — Apache-2.0 preset voices (publish-safe fallback when the clip is absent
                or chatterbox can't load).
  3. edge-tts — CRASH-NET ONLY (drafts; gray-area license for publish).

Every backend returns float32 mono at SR (44100) so per-run VO scripts can lay
segments on the timeline identically regardless of engine. Per-run scripts import:

    from vo_backends import synth, backend_report
    audio = synth("One sentence of narration.")   # picks best available backend

`backend_report()` returns {"backend": ..., "voice": ..., "license": ...} for the
Gmail-draft credits + voice_used.json. Keep phrase-level caption cues with cloned/
kokoro (no word timings); edge-tts still offers word timings if it's the engine.

CPU note: Chatterbox is a 0.5B model. Measured on the routine env 2026-07-14:
model load 12.6s (warm HF cache), generation 0.13x realtime on CPU, so a full
60s VO costs ~8-10 minutes. Budget it like a look-dev pass, not a render, and
start the VO build BEFORE the full-frame render so they overlap.

RUNTIME: execute the per-run VO build with `.venv-voice/bin/python` (created by
scripts/setup_env.sh) — chatterbox cannot install under the Debian-patched system
python (antlr4 sdist build bug). Under system python, synth() silently falls back
to kokoro/edge, so a wrong interpreter shows up in backend_report(), not a crash.
"""
import os
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
SR = 44100
CA = "/root/.ccr/ca-bundle.crt"

# The committed reference clip of the owner's voice (see assets/voice/README.md).
REF_CLIP = os.environ.get(
    "DISPATCH_VOICE_REF", os.path.join(REPO, "assets", "voice", "talon_ref.wav")
)

# Chatterbox delivery dials for a measured, documentary narrator.
# exaggeration <0.5 flattens theatrics; cfg_weight 0.5 keeps pacing natural.
CLONE_KW = dict(exaggeration=0.45, cfg_weight=0.5)

_state = {"backend": None, "model": None}


def _ca_env():
    if os.path.exists(CA):
        os.environ.setdefault("SSL_CERT_FILE", CA)
        os.environ.setdefault("REQUESTS_CA_BUNDLE", CA)
        os.environ.setdefault("CURL_CA_BUNDLE", CA)


def _to_sr(a, sr_in):
    a = np.asarray(a, np.float32)
    if a.ndim > 1:
        a = a.mean(0) if a.shape[0] < a.shape[-1] else a.mean(1)
    if sr_in != SR:
        from math import gcd
        from scipy.signal import resample_poly
        g = gcd(int(sr_in), SR)
        a = resample_poly(a, SR // g, sr_in // g).astype(np.float32)
    return a


# ---------------------------------------------------------------- cloned (chatterbox)
def cloned_available():
    """True only when the ref clip exists AND the full chatterbox stack loads.

    Chatterbox lives in the dedicated `.venv-voice` venv (see setup_env.sh) —
    run the VO build under `.venv-voice/bin/python` to get the cloned voice;
    under the system python this returns False and synth() falls back safely.
    The perth check matters: with setuptools>=81 the watermarker import fails
    SILENTLY (PerthImplicitWatermarker=None) and chatterbox's constructor
    crashes with "'NoneType' object is not callable".
    """
    if not os.path.exists(REF_CLIP):
        return False
    try:
        import chatterbox  # noqa: F401
        import perth
        return perth.PerthImplicitWatermarker is not None
    except Exception:
        return False


def cloned_synth(text):
    """Zero-shot clone of the committed reference clip. Returns float32 mono @ SR."""
    _ca_env()
    if _state["model"] is None:
        from chatterbox.tts import ChatterboxTTS
        _state["model"] = ChatterboxTTS.from_pretrained(device="cpu")
    m = _state["model"]
    wav = m.generate(text, audio_prompt_path=REF_CLIP, **CLONE_KW)
    a = wav.squeeze().cpu().numpy() if hasattr(wav, "cpu") else np.asarray(wav)
    return _to_sr(a, m.sr)


# ---------------------------------------------------------------- kokoro (presets)
KOKORO_VOICE = os.environ.get("DISPATCH_KOKORO_VOICE", "af_heart")
_kp = {"p": None}


def kokoro_synth(text):
    if _kp["p"] is None:
        from kokoro import KPipeline
        _kp["p"] = KPipeline(lang_code="a")
    chunks = [au for _, _, au in _kp["p"](text, voice=KOKORO_VOICE, speed=0.85)]
    a = np.concatenate(chunks) if chunks else np.zeros(1, np.float32)
    return _to_sr(a, 24000)


# ---------------------------------------------------------------- edge-tts (crash net)
EDGE_VOICE = os.environ.get("DISPATCH_EDGE_VOICE", "en-US-AvaMultilingualNeural")


def edge_synth(text):
    import subprocess, tempfile
    from scipy.io import wavfile
    _ca_env()
    env = dict(os.environ)
    with tempfile.TemporaryDirectory() as td:
        mp3 = os.path.join(td, "p.mp3")
        cmd = ["edge-tts", "--voice", EDGE_VOICE, "--rate=-3%", "--text", text,
               "--write-media", mp3]
        proxy = env.get("HTTPS_PROXY", "")
        if proxy:
            cmd = cmd[:1] + ["--proxy", proxy] + cmd[1:]
        r = subprocess.run(cmd, capture_output=True, text=True, env=env)
        if r.returncode or not os.path.exists(mp3) or os.path.getsize(mp3) < 500:
            raise RuntimeError(f"edge-tts failed: {r.stderr[-300:]}")
        wav = os.path.join(td, "p.wav")
        subprocess.run(["ffmpeg", "-y", "-i", mp3, "-ac", "1", "-ar", str(SR),
                        "-f", "wav", wav], capture_output=True, env=env)
        _, d = wavfile.read(wav)
    return (d.astype(np.float32) / 32768.0) if d.dtype == np.int16 else d.astype(np.float32)


# ---------------------------------------------------------------- picker
def synth(text):
    """Synthesize one phrase with the best available backend (sticky per process)."""
    if _state["backend"] is None:
        if cloned_available():
            _state["backend"] = "cloned"
        else:
            try:
                import kokoro  # noqa: F401
                _state["backend"] = "kokoro"
            except Exception:
                _state["backend"] = "edge"
    return {"cloned": cloned_synth, "kokoro": kokoro_synth, "edge": edge_synth}[_state["backend"]](text)


def backend_report():
    b = _state["backend"] or ("cloned" if cloned_available() else "unset")
    return {
        "cloned": {"backend": "chatterbox-clone", "voice": "owner reference clip (talon_ref.wav)",
                   "license": "Chatterbox MIT (commercial OK); output watermarked (Resemble Perth)"},
        "kokoro": {"backend": "kokoro", "voice": f"kokoro:{KOKORO_VOICE}",
                   "license": "Apache-2.0"},
        "edge":   {"backend": "edge-tts", "voice": f"edge:{EDGE_VOICE}",
                   "license": "draft-only (Azure neural TTS gray area)"},
        "unset":  {"backend": "unset", "voice": "-", "license": "-"},
    }[b]


if __name__ == "__main__":
    # Quick audition: python vo_backends.py "line to speak" out.wav
    import sys
    from scipy.io import wavfile
    line = sys.argv[1] if len(sys.argv) > 1 else "Alaska dot A I. Voice check."
    out = sys.argv[2] if len(sys.argv) > 2 else "voice_check.wav"
    a = synth(line)
    wavfile.write(out, SR, (np.clip(a, -1, 1) * 32767).astype(np.int16))
    print(f"[{backend_report()['backend']}] wrote {out} ({len(a)/SR:.2f}s)")
