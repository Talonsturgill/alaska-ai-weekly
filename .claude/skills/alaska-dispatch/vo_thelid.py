"""VO for Dispatch 'The Lid' (UAF wildfire-smoke ML bias-correction).
Kokoro publish voice bf_emma (calm, composed); edge-tts fallback via the agent proxy.
16 phrases mapped to 6 shots (segments 0-5). Writes, in the skill audio dir AND a copy in
out/dispatch/audio:  vo60.wav, timing60.json (starts, seg_starts, shot_bounds, speech_end),
words60.json (phrase caption cues), voice_used.json.
No em/en dashes anywhere. Numbers written for the synth.
"""
import os, sys, json, subprocess, shutil
import numpy as np
from scipy.io import wavfile
from scipy.signal import resample_poly

HERE = os.path.dirname(os.path.abspath(__file__))
AUD = os.path.join(HERE, "audio"); os.makedirs(AUD, exist_ok=True)
OUTDIR = os.path.abspath(os.path.join(HERE, "..", "..", "..", "out", "dispatch", "audio")); os.makedirs(OUTDIR, exist_ok=True)
SR = 44100; FPS = 30; TOTAL = 60.0
LEAD = 0.50; GAP_IN = 0.12; GAP_SEG = 0.34
KOKORO_VOICE = "bf_emma"; KOKORO_SPEED = 0.92
EDGE_VOICE = "en-GB-SoniaNeural"; EDGE_RATE = "-4%"
CA = "/root/.ccr/ca-bundle.crt"; PROXY = os.environ.get("HTTPS_PROXY", "")

# (phrase text, shot/segment index 0..5). Caption chunks stay whole (no number split, no stranded word).
PHRASES = [
    ("When Alaska burns, the smoke is the part that reaches everyone.", 0),
    ("It sinks into the valleys, and for weeks, people breathe it.", 0),
    ("So the state runs a model that forecasts the smoke two days out.", 0),
    ("But that model has a habit. It reads the air too clean.", 1),
    ("On bad days it undercounts the surface smoke by up to five times.", 1),
    ("Here is why. A warm lid of air seals the valley.", 1),
    ("It traps the smoke down low, where we breathe.", 2),
    ("The model keeps drawing it thin and high.", 2),
    ("So a team at the University of Alaska Fairbanks taught a second model to correct the first.", 3),
    ("It learns the error and pulls the forecast down toward the air people breathe.", 3),
    ("The gap shrinks. Five times too low becomes about two.", 3),
    ("But this is a correction, not a cure. It sharpens the number.", 4),
    ("It cannot move the smoke.", 4),
    ("And when a cloud hides a fire, the model can still miss it.", 4),
    ("So the forecast lands closer, sooner.", 5),
    ("And a person still decides when the air is safe to breathe.", 5),
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
        KP = KPipeline(lang_code="b")   # 'b' = British English for bf_emma
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

backend = None
try:
    import kokoro  # noqa
    backend = "kokoro"; synth = kokoro_synth; voice_id = f"kokoro:{KOKORO_VOICE}"
    voice_lic = "Apache-2.0 (commercial use OK, no attribution required)"
except Exception:
    backend = "edge"; synth = edge_synth; voice_id = f"edge_tts:{EDGE_VOICE}"
    voice_lic = "Microsoft Azure Neural TTS (draft cut; gray area for commercial publish)"
print("VO backend:", backend, voice_id)

clips = []
for i, (txt, seg) in enumerate(PHRASES):
    a = synth(txt, i)
    thr = 0.01 * (np.abs(a).max() + 1e-9)
    nz = np.where(np.abs(a) > thr)[0]
    if len(nz): a = a[max(0, nz[0] - int(0.02 * SR)):min(len(a), nz[-1] + int(0.04 * SR))]
    clips.append(a)
    print(f"  p{i:02d} seg{seg} {len(a)/SR:5.2f}s  {txt!r}")

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
if speech_end > 55.5:
    scale = (55.0 - LEAD) / (speech_end - LEAD)
    buf, starts, seg_starts, speech_end = build(LEAD, GAP_IN * scale, GAP_SEG * scale)
    print(f"  (compressed gaps x{scale:.2f} to fit; speech_end={speech_end:.2f})")
print("speech_end", round(speech_end, 2))

buf = buf / (np.max(np.abs(buf)) + 1e-9) * (10 ** (-1.5 / 20))
vo_path = os.path.join(AUD, "vo60.wav")
wavfile.write(vo_path, SR, (np.stack([buf, buf], 1) * 32767).astype(np.int16))

words = []
for i, (txt, seg) in enumerate(PHRASES):
    words.append({"w": txt, "s": starts[i], "e": round(starts[i] + len(clips[i]) / SR, 3), "seg": seg})
n_seg = max(s for _, s in PHRASES) + 1
seg_start_list = [round(seg_starts[k], 3) for k in range(n_seg)]
shot_seg = list(range(n_seg))
shot_bounds = [int(round(seg_start_list[s] * FPS)) for s in shot_seg]
timing = {"starts": starts, "seg_starts": seg_start_list, "beats": [int(round(s * FPS)) for s in starts],
          "shot_seg": shot_seg, "shot_bounds": shot_bounds, "speech_end": round(speech_end, 3),
          "total": TOTAL, "fps": FPS}
json.dump(timing, open(os.path.join(AUD, "timing60.json"), "w"), indent=2)
json.dump({"words": words, "speech_end": round(speech_end, 3), "total": TOTAL, "fps": FPS},
          open(os.path.join(AUD, "words60.json"), "w"), indent=2)
json.dump({"voice": voice_id, "license": voice_lic, "backend": backend},
          open(os.path.join(AUD, "voice_used.json"), "w"), indent=2)

# mirror the caption/timing artifacts into out/dispatch/audio for the gates + flow_check
for fn in ("vo60.wav", "timing60.json", "words60.json", "voice_used.json"):
    shutil.copy(os.path.join(AUD, fn), os.path.join(OUTDIR, fn))
print("wrote vo60.wav + cues; shot_bounds:", shot_bounds, "| speech_end:", round(speech_end, 2))
