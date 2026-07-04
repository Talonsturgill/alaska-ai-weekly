"""60s WhaleSpotter/fin-whale VO -- 11 segments, Kokoro (bf_emma), PUBLISH voice.
Uses kokoro's native per-token start_ts/end_ts (no VTT hack needed) for word-synced captions.
Writes:
  audio/vo60.wav        the 60s VO bed (mono -> stereo, normalized)
  audio/timing60.json   segment starts/beats/durs/speech_end
  audio/words60.json    global word list [{w,s,e,seg}] for kinetic captions
"""
import os, json
import numpy as np
from kokoro import KPipeline

HERE = os.path.dirname(os.path.abspath(__file__))
AUD = os.path.join(HERE, "audio")
os.makedirs(AUD, exist_ok=True)

VOICE = "bf_emma"
SR = 24000
FPS = 30
LEAD = 0.35
GAP = 0.15
TOTAL = 60.0
SPEED = 1.24  # tuned empirically against this voice's measured pace to land ~57-58s of speech

SEG = [
    "On June twenty first, a cruise ship carrying four thousand passengers docked in Seward with something dead across its bow.",
    "A pregnant, sixty one foot fin whale. Preliminary findings are consistent with a vessel strike. The cause is still not final.",
    "Three miles out, the same dark water looks different to another kind of ship.",
    "Matson's cargo fleet already runs an AI system called WhaleSpotter. The company says its thermal cameras can spot a whale's heat from three miles out.",
    "It doesn't see a whale. It sees heat: a warm shape glowing on a screen.",
    "The company says it flags that heat in time to turn, more than nine times in ten.",
    "No Alaska cruise ship is publicly known to carry anything like it.",
    "Nobody offered Royal Caribbean this system. Nobody turned it down. Only the gap is real.",
    "The AI can't steer a four thousand passenger ship. It can't make a captain slow down.",
    "It only puts one fact on a screen: something is out there. Someone still has to act.",
    "Tonight, two kinds of ships share this water. One that watches the dark. One that still doesn't.",
]

pipeline = KPipeline(lang_code="a")

durs = []
clips = []
wordseg = []
for i, txt in enumerate(SEG, 1):
    audio_chunks = []
    words = []
    off = 0.0
    for result in pipeline(txt, voice=VOICE, speed=SPEED):
        a = result.audio.numpy() if hasattr(result.audio, "numpy") else np.asarray(result.audio)
        audio_chunks.append(a)
        if result.tokens:
            for tk in result.tokens:
                if tk.text.strip() and getattr(tk, "start_ts", None) is not None:
                    words.append((off + tk.start_ts, off + tk.end_ts, tk.text))
        off += len(a) / SR
    clip = np.concatenate(audio_chunks) if audio_chunks else np.zeros(1, dtype=np.float32)
    durs.append(len(clip) / SR)
    clips.append(clip)
    wordseg.append(words)
    print(f"s{i}: {durs[-1]:.2f}s  words={len(words)}  text={txt[:40]!r}")

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
    if s < N:
        e = min(s + len(c), N)
        buf[s:e] += c[: e - s]
    for (ws, we, w) in wordseg[i]:
        words_out.append({"w": w, "s": round(t + ws, 3), "e": round(t + we, 3), "seg": i})
    t += durs[i] + GAP

speech_end = t - GAP
print("speech_end", round(speech_end, 2), "total words", len(words_out))
if speech_end > TOTAL:
    print(f"WARNING: speech_end {speech_end:.2f}s exceeds TOTAL {TOTAL}s -- will need to trim/speed up")

peak = np.max(np.abs(buf)) + 1e-9
buf = buf / peak * (10 ** (-1.5 / 20))
stereo = np.stack([buf, buf], 1)
from scipy.io import wavfile
wavfile.write(os.path.join(AUD, "vo60.wav"), SR, (stereo * 32767).astype(np.int16))

json.dump(
    {"starts": starts, "beats": beats, "durs": durs, "speech_end": speech_end, "total": TOTAL, "fps": FPS, "sr": SR},
    open(os.path.join(AUD, "timing60.json"), "w"), indent=2,
)
json.dump(
    {"words": words_out, "speech_end": speech_end, "total": TOTAL, "fps": FPS},
    open(os.path.join(AUD, "words60.json"), "w"), indent=2,
)
print("wrote vo60.wav, timing60.json, words60.json")
