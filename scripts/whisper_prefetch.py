#!/usr/bin/env python3
"""Put the faster-whisper models the VO pipeline loads into the Hugging Face cache at setup, with backoff.

Machine pass 2026-11-28 (queue hf-whisper-rate-limit). On 11-26 vo_synth_gemini paid for three Gemini
takes, then died on a Hugging Face 429 fetching faster-whisper-small for its alignment, and the run
resumed with VO_REUSE_TAKES=1 after fetching the model by hand. A fresh container has an empty cache,
so the first WhisperModel("small") call in a run is a network fetch at the most expensive moment.
scripts/setup_env.sh runs this before any paid synth, so the synth, vo_soundcheck ("base"),
dispatch_captions and align_captions load from disk.

    python3 scripts/whisper_prefetch.py           # fetch any missing model, retrying a 429 with backoff
    python3 scripts/whisper_prefetch.py --check   # exit 0 when every model loads from the cache alone
"""
import sys
import time

MODELS = ("small", "base")   # vo_synth_gemini, dispatch_captions, align_captions: small; vo_soundcheck: base
DELAYS = (0, 15, 45, 120)


def cached(size):
    from faster_whisper.utils import download_model
    try:
        download_model(size, local_files_only=True)
        return True
    except Exception:
        return False


def fetch(size):
    from faster_whisper.utils import download_model
    last = None
    for d in DELAYS:
        if d:
            print(f"whisper_prefetch: {size} retry in {d} s ({last})")
            time.sleep(d)
        try:
            download_model(size)
            return True
        except Exception as exc:   # a 429, a timeout, a dropped proxy connection
            last = str(exc).splitlines()[0][:160] if str(exc) else type(exc).__name__
    print(f"whisper_prefetch: WARN could not fetch faster-whisper {size}: {last}")
    return False


def main(argv):
    try:
        import faster_whisper  # noqa: F401
    except ImportError:
        print("whisper_prefetch: faster_whisper is not installed")
        return 1
    if argv[:1] == ["--check"]:
        missing = [m for m in MODELS if not cached(m)]
        if missing:
            print(f"whisper_prefetch --check: FAIL, not in the cache: {', '.join(missing)}")
            return 1
        print(f"whisper_prefetch --check: PASS, {', '.join(MODELS)} load from the cache with no network")
        return 0
    ok = True
    for m in MODELS:
        if cached(m):
            print(f"whisper_prefetch: {m} already cached")
        else:
            ok = fetch(m) and ok
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
