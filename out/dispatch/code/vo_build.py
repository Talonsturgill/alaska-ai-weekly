"""VO build for 'THE FAKE THAT SWAM' (2026-07-12 Dispatch).

Publish voice: edge-tts en-US-EmmaMultilingualNeural (calm, credible). Kokoro is the normal
publish backbone but is UNAVAILABLE in this environment: its required g2p model
(en_core_web_sm) is a GitHub release download the network policy returns 403 for, so we ship in
edge-tts and disclose it in the Gmail footer. edge-tts also gives real per-WORD WordBoundary
timings, which drive the kinetic captions directly (no stretch step needed).

TLS: edge-tts (aiohttp) must be routed THROUGH the agent proxy (proxy=HTTPS_PROXY) or it hits a
cert-verify failure against the MITM proxy. That is the fix; do not disable verification.

Writes (to BOTH the skill audio dir, which dispatch_core.caption reads at import, and out/dispatch/audio):
  audio/vo60.wav        the ~60s edge-tts VO bed (stereo, -1.5 dBTP normalized)
  audio/timing60.json   segment starts/beats/durs/speech_end
  audio/words60.json    global word list [{w,s,e,seg}] for kinetic captions
"""
import os, asyncio, subprocess, json, shutil
import numpy as np
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
SKILL_AUD = os.path.join(ROOT, ".claude", "skills", "alaska-dispatch", "audio")
OUT_AUD = os.path.join(ROOT, "out", "dispatch", "audio")
os.makedirs(SKILL_AUD, exist_ok=True)
os.makedirs(OUT_AUD, exist_ok=True)

VOICE = os.environ.get("DISPATCH_VOICE", "en-US-EmmaMultilingualNeural")
RATE = os.environ.get("DISPATCH_RATE", "-4%")
SR = 44100
FPS = 30
LEAD = 0.4
GAP = 0.55
# deliberate, story-motivated extra pauses (seconds) added AFTER the given 1-based segment index.
# The big one after seg 8 is the "breath before the payoff" the audio_arc calls for, right before
# the correction ("So they said it plainly. This never happened.").
EXTRA_PAUSE = {5: 0.45, 8: 1.45, 9: 0.35, 10: 0.45}
TOTAL = 60.0
PROXY = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")

SEG = json.load(open(os.path.join(ROOT, "out", "dispatch", "vo_segments.json")))["segments"]


def sh(c, **k):
    return subprocess.run(c, check=True, capture_output=True, text=True, **k)


def dur(p):
    return float(sh(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]).stdout)


async def synth_edge(text, mp3_path):
    import edge_tts
    comm = edge_tts.Communicate(text, VOICE, rate=RATE, boundary="WordBoundary", proxy=PROXY)
    sub = edge_tts.SubMaker()
    with open(mp3_path, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                sub.feed(chunk)
    return [{"w": c.content, "s": c.start.total_seconds(), "e": c.end.total_seconds()} for c in sub.cues]


def load_wav_mono(p, sr=SR):
    w = p[:-4] + ".wav"
    sh(["ffmpeg", "-y", "-i", p, "-ac", "1", "-ar", str(sr), "-f", "wav", w])
    srr, d = wavfile.read(w)
    return (d.astype(np.float32) / 32768.0) if d.dtype == np.int16 else d.astype(np.float32)


def main():
    durs, edge_words, clips = [], [], []
    for i, text in enumerate(SEG, 1):
        mp3 = os.path.join(SKILL_AUD, f"e{i}.mp3")
        words = asyncio.run(synth_edge(text, mp3))
        edur = dur(mp3)
        durs.append(edur); edge_words.append(words); clips.append(load_wav_mono(mp3))
        print(f"seg{i}: {edur:.2f}s words={len(words)}  '{text[:42]}...'")

    N = int(TOTAL * SR)
    buf = np.zeros(N, np.float32)
    t = LEAD
    beats, starts, words_out = [], [], []
    last_gap = GAP
    for i, clip in enumerate(clips):
        s = int(t * SR)
        starts.append(round(t, 3)); beats.append(round(t * FPS))
        e = min(s + len(clip), N)
        buf[s:e] += clip[: e - s]
        for w in edge_words[i]:
            words_out.append({"w": w["w"], "s": round(t + w["s"], 3), "e": round(t + w["e"], 3), "seg": i})
        last_gap = GAP + EXTRA_PAUSE.get(i + 1, 0.0)
        t += durs[i] + last_gap

    speech_end = t - last_gap
    print("speech_end", round(speech_end, 2), "beats", beats, "words", len(words_out))
    peak = np.max(np.abs(buf)) + 1e-9
    buf = buf / peak * (10 ** (-1.5 / 20))
    for AUD in (SKILL_AUD, OUT_AUD):
        wavfile.write(os.path.join(AUD, "vo60.wav"), SR, (np.stack([buf, buf], 1) * 32767).astype(np.int16))
        json.dump({"starts": starts, "beats": beats, "durs": durs, "speech_end": speech_end,
                   "total": TOTAL, "fps": FPS}, open(os.path.join(AUD, "timing60.json"), "w"), indent=2)
        json.dump({"words": words_out, "speech_end": speech_end, "total": TOTAL, "fps": FPS},
                  open(os.path.join(AUD, "words60.json"), "w"), indent=2)
    print(f"wrote vo60.wav, timing60.json, words60.json to skill audio + out/dispatch/audio  (voice={VOICE})")


if __name__ == "__main__":
    main()
