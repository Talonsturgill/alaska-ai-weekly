"""60s "The Launch Call" VO — Alaska tribal-health medevac AI/ML Dispatch (2026-07-06).
Kokoro am_michael (warm, trustworthy, publish voice), ONE call per beat phrase so each clip's
native per-word timestamps double as the caption cue window (no VTT parsing needed). Writes:
  audio/vo60.wav        the 60s VO bed (stereo, -1.5 dBTP normalized)
  audio/timing60.json   segment starts/beats/durs/speech_end (audio mix + scene beats)
  audio/words60.json    global cue list [{w,s,e,seg}] for kinetic captions (one cue per beat phrase)
"""
import os, json
import numpy as np
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__)); AUD = os.path.join(HERE, "audio"); os.makedirs(AUD, exist_ok=True)
VOICE = "am_michael"; SR = 24000; FPS = 30; LEAD = 0.30; GAP = 0.15; TOTAL = 60.0; SPEED = 1.14

# beat phrases in VO order (matches out/dispatch/storyboard.json > beats[] non-empty "vo" fields).
# Trimmed ~10% from the first draft: at normal pace + per-clip gaps, 143 words ran to ~67s (too long
# for the 60s master), so beats 2/4/6/7/9/11/13 are tightened without losing content, paired with a
# gentle SPEED=1.08 (still a calm, unhurried read, matches MOTION_INTENSITY=4).
SEG = [
    "Eighty percent of Alaska's communities have no road out.",
    "When someone in a village is critically sick,",
    "the only way out is by air,",
    "and a clinic worker faces the hardest call in rural medicine:",
    "launch the medevac, or wait.",
    "Alaska's tribal health system, working with Stanford,",
    "is testing a model built for that call.",
    "It weighs patient vitals, weather, and aircraft status",
    "into one score,",
    "trained on years of real flights across the tribal health system.",
    "No clinic runs it today.",
    "It's a research pilot. The rules for who owns that data,",
    "and who consents to it, still haven't been written.",
    "The community writes the guardrails before the model touches a patient.",
    "The score can inform the call.",
    "The person on the radio still makes it.",
    "Alaska.Ai.",
]

os.environ.setdefault("SSL_CERT_FILE", "/etc/ssl/certs/ca-certificates.crt")
os.environ.setdefault("SSL_CERT_DIR", "/etc/ssl/certs")

from kokoro import KPipeline
pipeline = KPipeline(lang_code="a")

durs = []; clips = []; wordcues = []
for i, txt in enumerate(SEG, 1):
    gen = pipeline(txt, voice=VOICE, speed=SPEED)
    audio = None; toks = []
    for r in gen:
        audio = r.audio.numpy().astype(np.float32)
        toks = r.tokens or []
        break
    d = len(audio) / SR
    durs.append(d); clips.append(audio)
    # one cue per beat phrase; caption() sub-divides it into kinetic per-word coloring itself
    wordcues.append((0.0, d, txt))
    print(f"beat{i}: {d:.2f}s  tokens={len(toks)}  '{txt[:40]}...'" if len(txt) > 40 else f"beat{i}: {d:.2f}s  tokens={len(toks)}  '{txt}'")

projected_end = LEAD + sum(durs) + (len(clips) - 1) * GAP
if projected_end > TOTAL - 3.0:
    raise SystemExit(f"VO too long: projected speech_end={projected_end:.2f}s leaves < 3s for the outro "
                      f"tail (TOTAL={TOTAL}s). Trim the script or raise SPEED.")

N = int(TOTAL * SR); buf = np.zeros(N, np.float32); t = LEAD; beats = []; starts = []; words = []
for i, c in enumerate(clips):
    s = int(t * SR); starts.append(round(t, 3)); beats.append(round(t * FPS))
    e = min(s + len(c), N); buf[s:e] += c[: max(0, e - s)]
    (ws, we, w) = wordcues[i]
    words.append({"w": w, "s": round(t + ws, 3), "e": round(t + we, 3), "seg": i})
    t += durs[i] + GAP
speech_end = t - GAP
print("speech_end", round(speech_end, 2), "n_beats", len(beats), "n_words", len(words))

buf = buf / (np.max(np.abs(buf)) + 1e-9) * (10 ** (-1.5 / 20))
wavfile.write(os.path.join(AUD, "vo60_24k.wav"), SR, (np.stack([buf, buf], 1) * 32767).astype(np.int16))
# resample to 44.1k stereo for the mix chain (audio_v3.py assumes 44100)
import subprocess
subprocess.run(["ffmpeg", "-y", "-i", os.path.join(AUD, "vo60_24k.wav"), "-ar", "44100", os.path.join(AUD, "vo60.wav")],
               check=True, capture_output=True)

json.dump({"starts": starts, "beats": beats, "durs": durs, "speech_end": speech_end, "total": TOTAL, "fps": FPS},
          open(os.path.join(AUD, "timing60.json"), "w"), indent=2)
json.dump({"words": words, "speech_end": speech_end, "total": TOTAL, "fps": FPS},
          open(os.path.join(AUD, "words60.json"), "w"), indent=2)
print("wrote vo60.wav, timing60.json, words60.json")
