"""Build the 'Teaching the Machine to See' VO (Bristol Bay sockeye drone/CV pilot) on a 60s timeline
with phrase-level caption cues. Publish voice Kokoro if present; else edge-tts via the agent proxy
(driven through the Python API with an explicit proxy-CA SSL context, which is reliable here).
Writes audio/vo60.wav, audio/timing60.json, audio/words60.json, audio/voice_used.json."""
import os, sys, subprocess, json, asyncio, ssl
import numpy as np
from scipy.io import wavfile
from scipy.signal import resample_poly

HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.environ.get("DISPATCH_WORK") or os.path.abspath(os.path.join(HERE, "..", "..", "..", "out", "dispatch"))
AUD = os.path.join(WORK, "audio"); os.makedirs(AUD, exist_ok=True)
SR = 44100; FPS = 30; TOTAL = 60.0
LEAD = 0.50; GAP_IN = 0.14; GAP_SEG = 0.46
KOKORO_VOICE = "af_bella"; KOKORO_SPEED = 0.88
EDGE_VOICE = "en-US-EmmaMultilingualNeural"; EDGE_RATE = "-6%"
CA = "/root/.ccr/ca-bundle.crt"

# (phrase text, segment index 0..6 == shot 1..7). Caption chunks stay WHOLE (no split number, no stranded
# payoff word). Numbers are phonetic for TTS; on-screen numerals are drawn by the render, not spoken here.
# segment index == storyboard shot index (0..6 -> shot 1..7), so shot_bounds align to the 7 shots
PHRASES = [
    ("Every summer, Bristol Bay's sockeye come back by the million.", 0),
    ("For seventy years, people have counted them by hand,", 1),
    ("from wooden towers,", 1),
    ("ten minutes of every hour, around the clock.", 1),
    ("That count sets the season, when to fish, and when to stop.", 1),
    ("Now a drone lifts from a box at eight thirty,", 2),
    ("and films the run from above.", 2),
    ("But it cannot count. Not yet.", 3),
    ("First, a person has to teach it,", 3),
    ("marking each fish that crosses a line, several thousand of them.", 3),
    ("Only then can the model pick the fish out on its own.", 4),
    ("It has not been tested against the towers yet.", 5),
    ("And a shadow on the river can still fool it.", 5),
    ("So the counters still climb the towers,", 6),
    ("and the model learns to watch beside them.", 6),
    ("The hand still teaches. The count still comes home.", 6),
]

env = dict(os.environ); env["SSL_CERT_FILE"] = CA; env["SSL_CERT_DIR"] = os.path.dirname(CA)
def run(c): return subprocess.run(c, capture_output=True, text=True, env=env)

def _to_sr(a, sr_in):
    a = a.astype(np.float32)
    if a.ndim > 1: a = a.mean(1)
    if sr_in != SR:
        from math import gcd
        g = gcd(int(sr_in), SR); a = resample_poly(a, SR // g, sr_in // g).astype(np.float32)
    return a

KP = None
def kokoro_synth(text, idx):
    global KP
    if KP is None:
        from kokoro import KPipeline
        KP = KPipeline(lang_code="a")
    chunks = [au for _, _, au in KP(text, voice=KOKORO_VOICE, speed=KOKORO_SPEED)]
    a = np.concatenate(chunks) if chunks else np.zeros(1, np.float32)
    return _to_sr(np.asarray(a, np.float32), 24000)

# edge-tts via the Python API with an explicit SSL context that trusts the proxy CA (the CLI pins
# certifi and fails TLS through the re-terminating proxy; this path is verified working).
def edge_synth(text, idx):
    import edge_tts
    import edge_tts.communicate as ec
    ec._SSL_CTX = ssl.create_default_context(cafile=CA)
    mp3 = os.path.join(AUD, f"p{idx:02d}.mp3")
    async def _go():
        c = edge_tts.Communicate(text, EDGE_VOICE, rate=EDGE_RATE)
        await c.save(mp3)
    asyncio.run(_go())
    if not os.path.exists(mp3) or os.path.getsize(mp3) < 500:
        raise RuntimeError(f"edge-tts produced no audio for phrase {idx}")
    wav = mp3[:-4] + ".wav"
    r = run(["ffmpeg", "-y", "-i", mp3, "-ac", "1", "-ar", str(SR), "-f", "wav", wav])
    if not os.path.exists(wav):
        raise RuntimeError(f"ffmpeg mp3->wav failed on {idx}: {r.stderr[-300:]}")
    _, d = wavfile.read(wav)
    return (d.astype(np.float32) / 32768.0) if d.dtype == np.int16 else d.astype(np.float32)

# Gemini TTS (preferred when GEMINI_API_KEY is set in the routine env — most natural + best enunciation).
# Uses the free-tier-eligible gemini-2.5-flash-preview-tts model; returns 24kHz PCM. Falls back cleanly.
GEMINI_VOICE = "Kore"   # warm, firm, clear enunciation; alt: Leda, Aoede, Charon
GKEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
def gemini_synth(text, idx):
    from google import genai
    from google.genai import types
    client = genai.Client(api_key=GKEY)
    resp = client.models.generate_content(
        model="gemini-2.5-flash-preview-tts",
        contents=f"Read this in a warm, measured, human documentary-narrator voice, enunciating clearly: {text}",
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=GEMINI_VOICE)))),
    )
    pcm = resp.candidates[0].content.parts[0].inline_data.data
    a = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768.0
    return _to_sr(a, 24000)

# choose backend (Gemini > Kokoro > edge)
backend = None
if GKEY:
    try:
        from google import genai  # noqa
        backend = "gemini"; synth = gemini_synth; voice_id = f"gemini:{GEMINI_VOICE}"
        voice_lic = "Google Gemini TTS (gemini-2.5-flash-preview-tts) — check Google's terms for publishing"
    except Exception as _e:
        print("gemini requested but google-genai unavailable:", _e)
if backend is None:
    try:
        import kokoro  # noqa
        backend = "kokoro"; synth = kokoro_synth; voice_id = f"kokoro:{KOKORO_VOICE}"
        voice_lic = "Apache-2.0 (commercial use OK, no attribution required)"
    except Exception:
        backend = "edge"; synth = edge_synth; voice_id = f"edge_tts:{EDGE_VOICE}"
        voice_lic = "Microsoft Azure Neural TTS (DRAFT cut; add GEMINI_API_KEY for the natural Gemini voice)"
print("VO backend:", backend, voice_id)

clips = []
for i, (txt, seg) in enumerate(PHRASES):
    a = synth(txt, i)
    thr = 0.01 * (np.abs(a).max() + 1e-9)
    nz = np.where(np.abs(a) > thr)[0]
    if len(nz): a = a[max(0, nz[0] - int(0.02 * SR)):min(len(a), nz[-1] + int(0.04 * SR))]
    clips.append(a)
    print(f"  p{i:02d} seg{seg} {len(a)/SR:5.2f}s  {txt!r}")

NSEG = max(s for _, s in PHRASES) + 1
def build(lead, gap_in, gap_seg):
    N = int(TOTAL * SR); buf = np.zeros(N, np.float32)
    t = lead; starts = []; seg_starts = {}
    for i, (txt, seg) in enumerate(PHRASES):
        if seg not in seg_starts: seg_starts[seg] = t
        s = int(t * SR); e = min(s + len(clips[i]), N); buf[s:e] += clips[i][:e - s]
        starts.append(round(t, 3))
        dur = len(clips[i]) / SR
        nxt_seg = PHRASES[i + 1][1] if i + 1 < len(PHRASES) else seg
        t += dur + (gap_seg if nxt_seg != seg else gap_in)
    speech_end = t - (gap_seg if PHRASES[-1][1] != PHRASES[-2][1] else gap_in)
    return buf, starts, seg_starts, speech_end

buf, starts, seg_starts, speech_end = build(LEAD, GAP_IN, GAP_SEG)
# keep room for a ~10s outro: land speech_end <= 49.5s (compress gaps, then time-stretch clips if needed)
TARGET = 49.5
if speech_end > TARGET:
    scale = (TARGET - LEAD) / (speech_end - LEAD)
    buf, starts, seg_starts, speech_end = build(LEAD, GAP_IN * max(0.2, scale), GAP_SEG * max(0.3, scale))
    print(f"  (compressed gaps to fit; speech_end={speech_end:.2f})")
print("speech_end", round(speech_end, 2))

buf = buf / (np.max(np.abs(buf)) + 1e-9) * (10 ** (-1.5 / 20))
wavfile.write(os.path.join(AUD, "vo60.wav"), SR, (np.stack([buf, buf], 1) * 32767).astype(np.int16))

words = []
for i, (txt, seg) in enumerate(PHRASES):
    words.append({"w": txt, "s": starts[i], "e": round(starts[i] + len(clips[i]) / SR, 3), "seg": seg})
seg_start_list = [round(seg_starts[k], 3) for k in range(NSEG)]
shot_seg = list(range(NSEG))
shot_bounds = [int(round(seg_start_list[s] * FPS)) for s in shot_seg]
json.dump({"starts": starts, "seg_starts": seg_start_list, "beats": [int(round(s * FPS)) for s in starts],
           "shot_seg": shot_seg, "shot_bounds": shot_bounds, "speech_end": round(speech_end, 3),
           "total": TOTAL, "fps": FPS}, open(os.path.join(AUD, "timing60.json"), "w"), indent=2)
json.dump({"words": words, "speech_end": round(speech_end, 3), "total": TOTAL, "fps": FPS},
          open(os.path.join(AUD, "words60.json"), "w"), indent=2)
json.dump({"voice": voice_id, "license": voice_lic, "backend": backend},
          open(os.path.join(AUD, "voice_used.json"), "w"), indent=2)
print("wrote vo60.wav, timing60.json, words60.json | cues:", len(words), "| shot_bounds:", shot_bounds)
