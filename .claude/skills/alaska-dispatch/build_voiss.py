"""Build the 'Count from a Dot' VO on a 60s timeline with phrase-level caption cues.
Prefers Kokoro (Apache-2.0 publish voice af_heart); falls back to edge-tts via the agent proxy.
Writes audio/vo60.wav, audio/timing60.json, audio/words60.json (+ audio/voice_used.json)."""
import os, sys, subprocess, json
import numpy as np
from scipy.io import wavfile
from scipy.signal import resample_poly

HERE = os.path.dirname(os.path.abspath(__file__))
AUD = os.path.join(HERE, "audio"); os.makedirs(AUD, exist_ok=True)
SR = 44100; FPS = 30; TOTAL = 60.0
LEAD = 0.50; GAP_IN = 0.10; GAP_SEG = 0.42
KOKORO_VOICE = "af_heart"; KOKORO_SPEED = 0.85
EDGE_VOICE = "en-US-AndrewMultilingualNeural"; EDGE_RATE = "-4%"
CA = "/root/.ccr/ca-bundle.crt"; PROXY = os.environ.get("HTTPS_PROXY", "")

# (phrase text, segment index 0..9). Caption chunks stay WHOLE (no number split, no stranded payoff word).
PHRASES = [
    ("Right now, a volcano is erupting in Alaska.", 0),
    ("Great Sitkin has oozed lava for months.", 0),
    ("It sits on a chain of dozens of volcanoes.", 1),
    ("Nobody can stand on them and watch.", 2),
    ("So Alaska listens instead.", 2),
    ("Every rumble sends sound through the rock,", 3),
    ("and pressure through the air.", 3),
    ("The Alaska Volcano Observatory turns that sound", 4),
    ("into a picture, a spectrogram.", 4),
    ("Then they trained a model to read it,", 5),
    ("on over two hundred seventy thousand pictures.", 5),
    ("It tells tremor from explosion, quake from noise.", 6),
    ("On its test, right about eighty seven percent.", 6),
    ("But hearing is not foreseeing.", 7),
    ("It can name the sound the mountain makes.", 7),
    ("It cannot tell you the hour it blows.", 7),
    ("Push it past what it learned, and it slips.", 8),
    ("A person still keeps watch.", 8),
    ("So the mountain keeps speaking,", 9),
    ("and Alaska keeps listening.", 9),
]

env = dict(os.environ); env["SSL_CERT_FILE"] = CA; env["SSL_CERT_DIR"] = os.path.dirname(CA)
def run(c): return subprocess.run(c, capture_output=True, text=True, env=env)
def probe_dur(p):
    r = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p])
    try: return float(r.stdout.strip())
    except Exception: return 0.0

# ---- synthesis backends -> return float32 mono @ SR ----
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

def edge_synth(text, idx):
    mp3 = os.path.join(AUD, f"p{idx:02d}.mp3")
    cmd = ["edge-tts", "--voice", EDGE_VOICE, f"--rate={EDGE_RATE}", "--text", text, "--write-media", mp3]
    if PROXY: cmd = cmd[:1] + ["--proxy", PROXY] + cmd[1:]
    r = run(cmd)
    if r.returncode or not os.path.exists(mp3) or os.path.getsize(mp3) < 500:
        raise RuntimeError(f"edge-tts failed on phrase {idx}: {r.stderr[-300:]}")
    wav = mp3[:-4] + ".wav"
    run(["ffmpeg", "-y", "-i", mp3, "-ac", "1", "-ar", str(SR), "-f", "wav", wav])
    _, d = wavfile.read(wav)
    return (d.astype(np.float32) / 32768.0) if d.dtype == np.int16 else d.astype(np.float32)

# choose backend
backend = None
try:
    import kokoro  # noqa
    backend = "kokoro"; synth = kokoro_synth; voice_id = f"kokoro:{KOKORO_VOICE}"
    voice_lic = "Apache-2.0 (commercial use OK, no attribution required)"
except Exception:
    backend = "edge"; synth = edge_synth; voice_id = f"edge_tts:{EDGE_VOICE}"
    voice_lic = "Microsoft Azure Neural TTS (draft cut; gray area for commercial publish)"
print("VO backend:", backend, voice_id)

# ---- synthesize all phrases ----
clips = []
for i, (txt, seg) in enumerate(PHRASES):
    a = synth(txt, i)
    # trim leading/trailing near-silence for tight timing
    thr = 0.01 * (np.abs(a).max() + 1e-9)
    nz = np.where(np.abs(a) > thr)[0]
    if len(nz): a = a[max(0, nz[0] - int(0.02 * SR)):min(len(a), nz[-1] + int(0.04 * SR))]
    clips.append(a)
    print(f"  p{i:02d} seg{seg} {len(a)/SR:5.2f}s  {txt!r}")

# ---- lay on timeline ----
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
# if speech overflows (need room for the outro), compress gaps and/or speed is already fixed; scale gaps
if speech_end > 55.5:
    scale = (55.0 - LEAD) / (speech_end - LEAD)
    buf, starts, seg_starts, speech_end = build(LEAD, GAP_IN * scale, GAP_SEG * scale)
    print(f"  (compressed gaps x{scale:.2f} to fit; speech_end={speech_end:.2f})")
print("speech_end", round(speech_end, 2))

# normalize to -1.5 dBTP
buf = buf / (np.max(np.abs(buf)) + 1e-9) * (10 ** (-1.5 / 20))
wavfile.write(os.path.join(AUD, "vo60.wav"), SR, (np.stack([buf, buf], 1) * 32767).astype(np.int16))

# ---- word/caption cues + timing ----
words = []
for i, (txt, seg) in enumerate(PHRASES):
    words.append({"w": txt, "s": starts[i], "e": round(starts[i] + len(clips[i]) / SR, 3), "seg": seg})
seg_start_list = [round(seg_starts[k], 3) for k in range(10)]
# shot boundaries (frames): shots begin at segments [0,2,4,5,7,8,9]
shot_seg = [0, 2, 4, 5, 7, 8, 9]
shot_bounds = [int(round(seg_start_list[s] * FPS)) for s in shot_seg]
json.dump({"starts": starts, "seg_starts": seg_start_list, "beats": [int(round(s * FPS)) for s in starts],
           "shot_seg": shot_seg, "shot_bounds": shot_bounds, "speech_end": round(speech_end, 3),
           "total": TOTAL, "fps": FPS}, open(os.path.join(AUD, "timing60.json"), "w"), indent=2)
json.dump({"words": words, "speech_end": round(speech_end, 3), "total": TOTAL, "fps": FPS},
          open(os.path.join(AUD, "words60.json"), "w"), indent=2)
json.dump({"voice": voice_id, "license": voice_lic, "backend": backend},
          open(os.path.join(AUD, "voice_used.json"), "w"), indent=2)
print("wrote vo60.wav, timing60.json, words60.json | cues:", len(words), "| shot_bounds:", shot_bounds)
