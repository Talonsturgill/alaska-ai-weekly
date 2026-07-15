"""Clone-voiced, phrase-timed VO for 'THE GROUND'S TWIN' (Dispatch 2026-07-15).
Publish voice = owner's Chatterbox clone (vo_backends.cloned_synth); each caption phrase is
synthesized as its own clip and timed on a 60s line, so words60.json cues are phrase-accurate
without a word aligner. RUN WITH THE VOICE VENV:
  .venv-voice/bin/python build_vo_groundstwin.py
Writes audio/vo60.wav, audio/timing60.json (starts/beats/shot_bounds/speech_end),
audio/words60.json, audio/voice_used.json.
"""
import os, sys, json, hashlib
import numpy as np
from scipy.io import wavfile
from scipy.signal import resample_poly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("SSL_CERT_FILE", "/root/.ccr/ca-bundle.crt")
os.environ.setdefault("SSL_CERT_DIR", "/etc/ssl/certs")
import vo_backends as vb

HERE = os.path.dirname(os.path.abspath(__file__)); AUD = os.path.join(HERE, "audio"); os.makedirs(AUD, exist_ok=True)
CACHE = os.path.join(AUD, "vo_cache"); os.makedirs(CACHE, exist_ok=True)
SR = 44100; FPS = 30; TOTAL = 60.0; LEAD = 0.45; GAP_IN = 0.12; GAP_SEG = 0.40

# (phrase, shot index 0..4). Whole caption chunks (no stranded payoff word, no split number).
# MEASURED on this env: the clone runs ~89 wpm even at these compact phrasings (a "measured,
# clear documentary" delivery by design, per vo_backends.CLONE_KW) — materially slower than a
# typical TTS. Trimmed a second pass (from the original 129-word/86.9s-raw draft) so the gentler
# ATEMPO_CAP below lands close to natural speed instead of a 1.6x forced compression.
PHRASES = [
    ("In Utqiagvik, the ground itself is the foundation.", 0),
    ("Roads and runways rest on frozen soil, now warming.", 0),
    ("So Penn State built the road a twin.", 1),
    ("Two fiber optic cables, about a kilometer each.", 1),
    ("They feel its heat and tremor, every hour.", 1),
    ("Physics and machine learning copy the ground.", 2),
    ("As new data arrives, the twin corrects itself.", 2),
    ("It runs a step ahead of the thaw,", 3),
    ("before it reaches the road.", 3),
    ("Here is the honest part.", 4),
    ("It predicts the ground. It cannot freeze it back.", 4),
    ("One road, three years of data. Not the whole Arctic.", 4),
    ("A road that sees the thaw coming is one you can save.", 4),
    ("This is Alaska dot A I.", 4),
]
TARGET_SPEECH = 52.5    # atempo-fit the assembled VO so speech ends near here (outro fills to ~59.5)
ATEMPO_CAP = 1.35        # gentler ceiling than raw 1.6x so the clone's cadence still sounds natural

def _cache_key(text):
    return hashlib.sha1((vb.REF_CLIP + "|" + repr(vb.CLONE_KW) + "|" + text).encode()).hexdigest()[:16]

def synth_clip(text):
    key = _cache_key(text); cp = os.path.join(CACHE, f"{key}.npy")
    if os.path.exists(cp):
        return np.load(cp)
    a = np.asarray(vb.cloned_synth(text), dtype=np.float32)   # 24kHz mono
    if a.ndim > 1: a = a.mean(1)
    from math import gcd
    g = gcd(24000, SR)
    a = resample_poly(a, SR // g, 24000 // g).astype(np.float32)
    thr = 0.01 * (np.abs(a).max() + 1e-9)
    nz = np.where(np.abs(a) > thr)[0]
    if len(nz): a = a[max(0, nz[0] - int(0.02 * SR)):min(len(a), nz[-1] + int(0.05 * SR))]
    np.save(cp, a)
    return a

print("VO backend:", vb.backend_report(), flush=True)
clips = []
for i, (txt, sh) in enumerate(PHRASES):
    a = synth_clip(vb.normalize_for_tts(txt))
    clips.append(a)
    print(f"  p{i:02d} shot{sh} {len(a)/SR:5.2f}s  {txt!r}", flush=True)

# A deliberate BREATH after the honest-caveat line (index 10, "...cannot freeze it back.") and
# before the scope-honesty line (index 11, "One road, three years..."). Continuous narration has
# no pause long enough for a real silence dip, and VOICE_AND_SCORE.md / storyboard_check.py require
# one as a hard-gated story beat (quality_gate.py's SILENCE_DIP reads storyboard.json audio_arc).
# This is RAW seconds (pre-atempo); divided by ~1.35x it still lands near 1.1-1.2s, enough for the
# gate's +/-0.35s measurement window with margin on both sides.
PAUSE_AFTER = {10: 1.55}

def build(lead, gap_in, gap_seg):
    # size the RAW buffer to fit the actual (possibly >60s, pre-atempo) content — never truncate
    # mid-layout. The atempo-fit pass below shrinks the result back to the 60s timeline.
    total_raw = lead + sum(len(c) / SR for c in clips) + gap_seg * len(PHRASES) + sum(PAUSE_AFTER.values()) + 2.0
    N = int(total_raw * SR); buf = np.zeros(N, np.float32); t = lead; starts = []; shot_starts = {}
    pause_span = None
    for i, (txt, sh) in enumerate(PHRASES):
        if sh not in shot_starts: shot_starts[sh] = t
        s = int(t * SR); e = min(s + len(clips[i]), N); buf[s:e] += clips[i][:e - s]
        starts.append(round(t, 3)); dur = len(clips[i]) / SR
        nxt = PHRASES[i + 1][1] if i + 1 < len(PHRASES) else sh
        gap = (gap_seg if nxt != sh else gap_in) + PAUSE_AFTER.get(i, 0.0)
        if i in PAUSE_AFTER:
            pause_span = (round(t + dur, 3), round(t + dur + gap, 3))
        t += dur + gap
    speech_end = t - (gap_seg if PHRASES[-1][1] != PHRASES[-2][1] else gap_in)
    return buf[:int((speech_end + 2.0) * SR)], starts, shot_starts, speech_end, pause_span

buf, starts, shot_starts, speech_end, pause_span = build(LEAD, GAP_IN, GAP_SEG)
print("raw speech_end", round(speech_end, 2), "raw buf", round(len(buf)/SR, 2), "s pause_span", pause_span, flush=True)

# ---- atempo fit: gently speed the whole assembled VO (pitch-preserving) so speech lands ~TARGET ----
import subprocess, tempfile
clip_durs = [len(c) / SR for c in clips]
atempo = 1.0
if speech_end > TARGET_SPEECH:
    atempo = min(ATEMPO_CAP, max(1.0, speech_end / TARGET_SPEECH))
    raw = os.path.join(AUD, "_vo_raw.wav"); fit = os.path.join(AUD, "_vo_fit.wav")
    wavfile.write(raw, SR, (buf / (np.max(np.abs(buf)) + 1e-9) * 0.98 * 32767).astype(np.int16))
    subprocess.run(["ffmpeg", "-y", "-i", raw, "-filter:a", f"atempo={atempo:.4f}", "-ar", str(SR), fit],
                   check=True, capture_output=True)
    _, d = wavfile.read(fit)
    d = (d.astype(np.float32) / 32768.0) if d.dtype == np.int16 else d.astype(np.float32)
    if d.ndim > 1: d = d.mean(1)
    N = int(TOTAL * SR); buf = np.zeros(N, np.float32); buf[:min(N, len(d))] = d[:min(N, len(d))]
    starts = [round(s / atempo, 3) for s in starts]
    shot_starts = {k: v / atempo for k, v in shot_starts.items()}
    clip_durs = [c / atempo for c in clip_durs]
    speech_end = round(speech_end / atempo, 3)
    if pause_span: pause_span = (round(pause_span[0] / atempo, 3), round(pause_span[1] / atempo, 3))
    for f in (raw, fit):
        try: os.remove(f)
        except OSError: pass
    print(f"  atempo={atempo:.3f} -> speech_end={speech_end:.2f}", flush=True)
# always land on an exact TOTAL-length buffer (atempo path already does; cover the no-atempo path too)
Nfinal = int(TOTAL * SR)
if len(buf) != Nfinal:
    fixed = np.zeros(Nfinal, np.float32); fixed[:min(Nfinal, len(buf))] = buf[:min(Nfinal, len(buf))]; buf = fixed
print("final speech_end", round(speech_end, 2), flush=True)

buf = buf / (np.max(np.abs(buf)) + 1e-9) * (10 ** (-1.5 / 20))
wavfile.write(os.path.join(AUD, "vo60.wav"), SR, (np.stack([buf, buf], 1) * 32767).astype(np.int16))

words = [{"w": txt, "s": starts[i], "e": round(starts[i] + clip_durs[i], 3), "seg": sh}
         for i, (txt, sh) in enumerate(PHRASES)]
shot_seg = sorted(shot_starts)
shot_bounds = [int(round(shot_starts[s] * FPS)) for s in shot_seg]
shot_bounds[0] = 0
json.dump({"starts": starts, "beats": [int(round(s * FPS)) for s in starts],
           "shot_seg": shot_seg, "shot_bounds": shot_bounds, "speech_end": round(speech_end, 3),
           "pause_span": list(pause_span) if pause_span else None,
           "total": TOTAL, "fps": FPS}, open(os.path.join(AUD, "timing60.json"), "w"), indent=2)
json.dump({"words": words, "speech_end": round(speech_end, 3), "total": TOTAL, "fps": FPS},
          open(os.path.join(AUD, "words60.json"), "w"), indent=2)
rep = vb.backend_report()
json.dump({"voice": rep.get("voice"), "backend": rep.get("backend"), "license": rep.get("license")},
          open(os.path.join(AUD, "voice_used.json"), "w"), indent=2)
print("wrote vo60.wav, timing60.json, words60.json | cues:", len(words), "| shot_bounds:", shot_bounds, flush=True)
