#!/usr/bin/env python3
"""Synthesize the Dispatch VO with edge-tts (Microsoft neural voice), per line,
capturing exact word-boundary timings for frame-accurate captions.

Owner directive (2026-07-16): do NOT use the cloned voice; use the most human
option available. edge-tts Microsoft neural (Andrew Multilingual) is that option.
Word boundaries come straight from the synth engine, so caption timings are
ground-truth, not whisper-estimated.

Outputs into out/dispatch/audio/:
  vo_line_XX.wav        per-line mono 44.1k
  vo.wav                assembled VO with beat gaps
  vo_words.json         [{word, start, end}] on the assembled timeline (seconds)
  vo_lines.json         [{idx, text, start, end}] line spans on the timeline
"""
import asyncio
import json
import os
import subprocess
import sys

import edge_tts

# ---------------------------------------------------------------------------
# THE PROXY AND CA ACCOMMODATION (2026-09-23). Without this the fallback cannot
# reach Microsoft at all in the routine's container, which is the one situation
# a fallback exists for.
#
# Two separate faults, and fixing one alone still fails:
#   1. aiohttp does not read HTTPS_PROXY unless a session is built with
#      trust_env=True, so edge-tts dials speech.platform.bing.com directly.
#   2. Outbound TLS is re-terminated by the agent proxy, so the chain must be
#      verified against /root/.ccr/ca-bundle.crt rather than certifi's roots.
# The symptom of either is the same misleading line, "self-signed certificate
# in certificate chain", which reads like a broken remote and is not one.
# NEVER "fix" this by disabling verification.
# ---------------------------------------------------------------------------
import ssl as _ssl
import aiohttp as _aiohttp

_CA = os.environ.get("SSL_CERT_FILE") or "/root/.ccr/ca-bundle.crt"
PROXY = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy") or None

if os.path.exists(_CA):
    _orig_session_init = _aiohttp.ClientSession.__init__

    def _session_init(self, *args, **kwargs):
        kwargs.setdefault("trust_env", True)
        if kwargs.get("connector") is None:
            kwargs["connector"] = _aiohttp.TCPConnector(
                ssl=_ssl.create_default_context(cafile=_CA))
        return _orig_session_init(self, *args, **kwargs)

    _aiohttp.ClientSession.__init__ = _session_init

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, ".."))
OUT = os.path.join(REPO, "out", "dispatch")
AUD = os.path.join(OUT, "audio")
os.makedirs(AUD, exist_ok=True)
def _ffmpeg():
    """Prefer an ffmpeg that can DECODE MP3 (2026-09-23).

    The playwright-bundled build at /opt/pw-browsers is a video-only build with
    no mp3 decoder, and edge-tts returns mp3. It fails with exit 183 and
    "Invalid data found when processing input", which reads like a corrupt
    download and is not one: the file is fine and the decoder is missing.
    The system ffmpeg decodes it, so prefer that and keep the bundled one as
    the fallback rather than the default."""
    override = os.environ.get("FFMPEG_BIN")
    if override:
        return override
    for cand in ("/usr/bin/ffmpeg", "/usr/local/bin/ffmpeg",
                 "/opt/pw-browsers/ffmpeg-1011/ffmpeg-linux"):
        if os.path.exists(cand):
            return cand
    return "ffmpeg"


FFMPEG = _ffmpeg()
SR = 44100
GAP = 0.42  # seconds of breath between lines


async def synth_line(text, voice, rate, mp3_path):
    words = []
    comm = edge_tts.Communicate(text, voice, rate=rate, proxy=PROXY)
    with open(mp3_path, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                # offset/duration are in 100-ns ticks
                words.append({
                    "word": chunk["text"],
                    "start": chunk["offset"] / 1e7,
                    "end": (chunk["offset"] + chunk["duration"]) / 1e7,
                })
    return words


def to_wav(mp3_path, wav_path):
    subprocess.run(
        [FFMPEG, "-y", "-i", mp3_path, "-ar", str(SR), "-ac", "1", wav_path],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )


def dur(wav_path):
    out = subprocess.run(
        [FFMPEG, "-i", wav_path, "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    # parse "time=00:00:03.45"
    t = 0.0
    for tok in out.split():
        if tok.startswith("time="):
            hh, mm, ss = tok[5:].split(":")
            t = int(hh) * 3600 + int(mm) * 60 + float(ss)
    return t


def _texts(spec):
    """Line texts from either schema: bare strings, or {text,...} dicts."""
    out = []
    for item in spec["lines"]:
        out.append(item if isinstance(item, str) else item["text"])
    return out


async def main():
    with open(os.path.join(OUT, "vo_script.json")) as f:
        spec = json.load(f)
    # SCHEMA TOLERANCE (2026-09-23). The canonical out/dispatch/vo_script.json is
    # now a list of {text, idx, claims} dicts, because vo_claims_check.py and the
    # Gemini pipeline both read it that way. This fallback was still written
    # against the original list-of-bare-strings and blew up on a dict. A fallback
    # that only accepts a shape the pipeline stopped producing is not a fallback.
    voice = (spec.get("voice") or os.environ.get("DISPATCH_EDGE_VOICE")
             or "en-US-AndrewMultilingualNeural")
    rate = spec.get("rate") or os.environ.get("DISPATCH_EDGE_RATE") or "+0%"
    pause_after = {int(k): float(v) for k, v in spec.get("pause_after", {}).items()}

    all_words, all_lines = [], []
    concat_inputs = []
    cursor = 0.0
    n_lines = len(_texts(spec))
    for i, text in enumerate(_texts(spec)):
        mp3 = os.path.join(AUD, f"vo_line_{i:02d}.mp3")
        wav = os.path.join(AUD, f"vo_line_{i:02d}.wav")
        words = await synth_line(text, voice, rate, mp3)
        to_wav(mp3, wav)
        d = dur(wav)
        for w in words:
            all_words.append({
                "word": w["word"],
                "start": round(cursor + w["start"], 3),
                "end": round(cursor + min(w["end"], d), 3),
            })
        all_lines.append({"idx": i, "text": text,
                          "start": round(cursor, 3), "end": round(cursor + d, 3)})
        gap = pause_after.get(i, GAP) if i < n_lines - 1 else 0.0
        concat_inputs.append((wav, d, gap))
        cursor += d + gap
        print(f"line {i}: {d:.2f}s (+{gap:.2f}s pause)  '{text[:48]}'")

    total = cursor
    print(f"TOTAL VO: {total:.2f}s over {n_lines} lines")

    # assemble with per-line silence gaps (unique-duration silence files)
    listfile = os.path.join(AUD, "_concat.txt")
    made = {}
    with open(listfile, "w") as f:
        for j, (wav, _, gap) in enumerate(concat_inputs):
            f.write(f"file '{wav}'\n")
            if gap > 0.001:
                key = round(gap, 3)
                sil = made.get(key)
                if sil is None:
                    sil = os.path.join(AUD, f"_gap_{int(key*1000)}.wav")
                    subprocess.run([FFMPEG, "-y", "-f", "lavfi", "-t", str(key),
                                    "-i", f"anullsrc=r={SR}:cl=mono", sil],
                                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    made[key] = sil
                f.write(f"file '{sil}'\n")
    vo = os.path.join(AUD, "vo.wav")
    subprocess.run([FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", listfile,
                    "-ar", str(SR), "-ac", "1", vo],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    with open(os.path.join(OUT, "vo_words.json"), "w") as f:
        json.dump(all_words, f, indent=2)
    with open(os.path.join(OUT, "vo_lines.json"), "w") as f:
        json.dump({"total": round(total, 3), "gap": GAP, "voice": voice,
                   "rate": rate, "lines": all_lines}, f, indent=2)
    print(f"wrote {vo}, vo_words.json ({len(all_words)} words), vo_lines.json")


if __name__ == "__main__":
    asyncio.run(main())
