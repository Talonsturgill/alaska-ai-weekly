"""VO build for "The Depth Model" (2026-07-05 Dispatch).

Publishes in Kokoro bf_emma (Apache-2.0, calm/composed British voice) per config/voices.yaml.
edge-tts (en-GB-SoniaNeural) is used ONLY as the draft timing reference: it gives us real
per-WORD WordBoundary timestamps (via the edge_tts Communicate stream, not the CLI's coarser
--write-subtitles), and each Kokoro segment is time-stretched (ffmpeg atempo) to match its
edge-tts twin's exact duration, so the edge-derived word timings remain valid for the published
Kokoro audio (the documented "draft in edge-tts, re-cut in Kokoro, re-sync timing" workflow).

Writes:
  audio/vo60.wav        the ~60s Kokoro VO bed (stereo, -1.5 dBTP normalized)
  audio/timing60.json   segment starts/beats/durs/speech_end
  audio/words60.json    global word list [{w,s,e,seg}] for kinetic captions
"""
import os, asyncio, subprocess, json
import numpy as np
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
AUD = os.path.join(HERE, "audio")
os.makedirs(AUD, exist_ok=True)

EDGE_VOICE = "en-GB-SoniaNeural"
KOKORO_VOICE = "bf_emma"
SR = 44100
FPS = 30
LEAD = 0.4
GAP = 0.18
TOTAL = 60.0

SEG = [
    "A fishery can close over one bad weekend.",
    "In twenty twenty four, two boats caught enough king salmon by accident to shut down Alaska's pollock season.",
    "Every king salmon they take is one that never reaches a river.",
    "So a University of Alaska Fairbanks team tried something new.",
    "Thirteen years of tagged salmon in the Gulf of Alaska, over seven hundred thousand data points, trained a model that predicts where kings sit in the water by season and time of day.",
    "It cannot track one fish, or promise one tow comes up clear.",
    "What it shows is the odds, so a captain can choose a depth the model calls safer.",
    "Nobody has to use it.",
    "But if enough boats do, the same fish and the same nets could add up to a better bet, run after run.",
]

env = dict(os.environ)
env["SSL_CERT_FILE"] = "/etc/ssl/certs/ca-certificates.crt"
env["SSL_CERT_DIR"] = "/etc/ssl/certs"


def sh(c, **k):
    return subprocess.run(c, check=True, capture_output=True, text=True, env=env, **k)


def dur(p):
    return float(sh(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]).stdout)


async def synth_edge(text, mp3_path):
    import edge_tts
    comm = edge_tts.Communicate(text, EDGE_VOICE, boundary="WordBoundary")
    sub = edge_tts.SubMaker()
    with open(mp3_path, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                sub.feed(chunk)
    words = [{"w": c.content, "s": c.start.total_seconds(), "e": c.end.total_seconds()} for c in sub.cues]
    return words


def load_wav_mono(p, sr=SR):
    w = p[:-4] + ".wav" if p.endswith(".mp3") else p + ".wav"
    sh(["ffmpeg", "-y", "-i", p, "-ac", "1", "-ar", str(sr), "-f", "wav", w])
    srr, d = wavfile.read(w)
    return (d.astype(np.float32) / 32768.0) if d.dtype == np.int16 else d.astype(np.float32)


def atempo_chain(factor):
    """ffmpeg atempo is valid in [0.5, 2.0] per instance; chain for wider ratios."""
    fs = []
    f = factor
    while f > 2.0:
        fs.append(2.0)
        f /= 2.0
    while f < 0.5:
        fs.append(0.5)
        f /= 0.5
    fs.append(f)
    return ",".join(f"atempo={x:.6f}" for x in fs)


def main():
    kpipe = None
    durs = []
    edge_words = []
    kokoro_clips = []
    for i, text in enumerate(SEG, 1):
        mp3 = os.path.join(AUD, f"e{i}.mp3")
        words = asyncio.run(synth_edge(text, mp3))
        edur = dur(mp3)
        durs.append(edur)
        edge_words.append(words)
        print(f"edge s{i}: {edur:.2f}s words={len(words)}")

        if kpipe is None:
            from kokoro import KPipeline
            kpipe = KPipeline(lang_code="b")
        import soundfile as sf
        kwav = os.path.join(AUD, f"k{i}_raw.wav")
        chunks = []
        for res in kpipe(text, voice=KOKORO_VOICE):
            chunks.append(res.audio.numpy() if hasattr(res.audio, "numpy") else np.asarray(res.audio))
        audio = np.concatenate(chunks) if len(chunks) > 1 else chunks[0]
        sf.write(kwav, audio, 24000)
        kdur = dur(kwav)
        stretched = os.path.join(AUD, f"k{i}_stretch.wav")
        factor = kdur / edur
        af = atempo_chain(factor)
        sh(["ffmpeg", "-y", "-i", kwav, "-af", af, "-ar", str(SR), "-ac", "1", stretched])
        sdur = dur(stretched)
        print(f"kokoro s{i}: raw={kdur:.2f}s -> stretched={sdur:.2f}s (target {edur:.2f}s, factor {factor:.3f})")
        kokoro_clips.append(load_wav_mono(stretched))

    N = int(TOTAL * SR)
    buf = np.zeros(N, np.float32)
    t = LEAD
    beats = []
    starts = []
    words_out = []
    for i, clip in enumerate(kokoro_clips):
        s = int(t * SR)
        starts.append(round(t, 3))
        beats.append(round(t * FPS))
        e = min(s + len(clip), N)
        buf[s:e] += clip[: e - s]
        for w in edge_words[i]:
            words_out.append({"w": w["w"], "s": round(t + w["s"], 3), "e": round(t + w["e"], 3), "seg": i})
        t += durs[i] + GAP

    speech_end = t - GAP
    print("speech_end", round(speech_end, 2), "beats", beats, "words", len(words_out))
    buf = buf / (np.max(np.abs(buf)) + 1e-9) * (10 ** (-1.5 / 20))
    wavfile.write(os.path.join(AUD, "vo60.wav"), SR, (np.stack([buf, buf], 1) * 32767).astype(np.int16))
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
