"""Clone-voiced, phrase-timed VO for 'THE GROUND'S TWIN' (Dispatch 2026-07-15).
Publish voice = owner's Chatterbox clone (vo_backends.cloned_synth); each caption phrase is
synthesized as its own clip and timed on a 60s line, so words60.json cues are phrase-accurate
without a word aligner. RUN WITH THE VOICE VENV:
  .venv-voice/bin/python build_vo_groundstwin.py
Writes audio/vo60.wav, audio/timing60.json (starts/beats/shot_bounds/speech_end),
audio/words60.json, audio/voice_used.json.
"""
import os, sys, json
import numpy as np
from scipy.io import wavfile
from scipy.signal import resample_poly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("SSL_CERT_FILE", "/root/.ccr/ca-bundle.crt")
os.environ.setdefault("SSL_CERT_DIR", "/etc/ssl/certs")
import vo_backends as vb

HERE = os.path.dirname(os.path.abspath(__file__)); AUD = os.path.join(HERE, "audio"); os.makedirs(AUD, exist_ok=True)
SR = 44100; FPS = 30; TOTAL = 60.0; LEAD = 0.45; GAP_IN = 0.12; GAP_SEG = 0.40

# (phrase, shot index 0..4). Whole caption chunks (no stranded payoff word, no split number).
PHRASES = [
    ("In Utqiagvik,", 0),
    ("the ground itself is the foundation.", 0),
    ("Roads, runways, the pipes under town,", 0),
    ("all of it rests on frozen soil.", 0),
    ("And that soil is warming.", 0),
    ("So a team at Penn State", 1),
    ("built the road a twin.", 1),
    ("Two fiber optic cables, about a kilometer each,", 1),
    ("are buried in the embankment.", 1),
    ("They feel the heat and the tremor, every hour.", 1),
    ("A physics model and machine learning", 2),
    ("turn those readings into a living copy of the earth below.", 2),
    ("As new data arrives, the twin corrects itself.", 2),
    ("It learns how fast heat moves through the soil,", 3),
    ("and it runs a step ahead,", 3),
    ("forecasting the thaw before it reaches the road.", 3),
    ("Here is the honest part.", 4),
    ("The twin predicts the ground. It cannot freeze it back.", 4),
    ("And it is proven at one embankment,", 4),
    ("on about three years of data, not across the whole Arctic.", 4),
    ("Still, a road that can see its own thaw coming", 4),
    ("is a road you can save.", 4),
    ("That is the promise. Measured, and named.", 4),
    ("This is Alaska dot A I.", 4),
]

def synth_clip(text):
    a = np.asarray(vb.cloned_synth(text), dtype=np.float32)   # 24kHz mono
    if a.ndim > 1: a = a.mean(1)
    from math import gcd
    g = gcd(24000, SR)
    a = resample_poly(a, SR // g, 24000 // g).astype(np.float32)
    thr = 0.01 * (np.abs(a).max() + 1e-9)
    nz = np.where(np.abs(a) > thr)[0]
    if len(nz): a = a[max(0, nz[0] - int(0.02 * SR)):min(len(a), nz[-1] + int(0.05 * SR))]
    return a

print("VO backend:", vb.backend_report(), flush=True)
clips = []
for i, (txt, sh) in enumerate(PHRASES):
    a = synth_clip(vb.normalize_for_tts(txt))
    clips.append(a)
    print(f"  p{i:02d} shot{sh} {len(a)/SR:5.2f}s  {txt!r}", flush=True)

def build(lead, gap_in, gap_seg):
    N = int(TOTAL * SR); buf = np.zeros(N, np.float32); t = lead; starts = []; shot_starts = {}
    for i, (txt, sh) in enumerate(PHRASES):
        if sh not in shot_starts: shot_starts[sh] = t
        s = int(t * SR); e = min(s + len(clips[i]), N); buf[s:e] += clips[i][:e - s]
        starts.append(round(t, 3)); dur = len(clips[i]) / SR
        nxt = PHRASES[i + 1][1] if i + 1 < len(PHRASES) else sh
        t += dur + (gap_seg if nxt != sh else gap_in)
    speech_end = t - (gap_seg if PHRASES[-1][1] != PHRASES[-2][1] else gap_in)
    return buf, starts, shot_starts, speech_end

buf, starts, shot_starts, speech_end = build(LEAD, GAP_IN, GAP_SEG)
if speech_end > 56.0:
    scale = (55.5 - LEAD) / (speech_end - LEAD)
    buf, starts, shot_starts, speech_end = build(LEAD, GAP_IN * scale, GAP_SEG * scale)
    print(f"  (compressed gaps x{scale:.2f}; speech_end={speech_end:.2f})", flush=True)
print("speech_end", round(speech_end, 2), flush=True)

buf = buf / (np.max(np.abs(buf)) + 1e-9) * (10 ** (-1.5 / 20))
wavfile.write(os.path.join(AUD, "vo60.wav"), SR, (np.stack([buf, buf], 1) * 32767).astype(np.int16))

words = [{"w": txt, "s": starts[i], "e": round(starts[i] + len(clips[i]) / SR, 3), "seg": sh}
         for i, (txt, sh) in enumerate(PHRASES)]
shot_seg = sorted(shot_starts)
shot_bounds = [int(round(shot_starts[s] * FPS)) for s in shot_seg]
shot_bounds[0] = 0
json.dump({"starts": starts, "beats": [int(round(s * FPS)) for s in starts],
           "shot_seg": shot_seg, "shot_bounds": shot_bounds, "speech_end": round(speech_end, 3),
           "total": TOTAL, "fps": FPS}, open(os.path.join(AUD, "timing60.json"), "w"), indent=2)
json.dump({"words": words, "speech_end": round(speech_end, 3), "total": TOTAL, "fps": FPS},
          open(os.path.join(AUD, "words60.json"), "w"), indent=2)
rep = vb.backend_report()
json.dump({"voice": rep.get("voice"), "backend": rep.get("backend"), "license": rep.get("license")},
          open(os.path.join(AUD, "voice_used.json"), "w"), indent=2)
print("wrote vo60.wav, timing60.json, words60.json | cues:", len(words), "| shot_bounds:", shot_bounds, flush=True)
