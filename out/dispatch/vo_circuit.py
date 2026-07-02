"""64s Circuit-That-Won't-Close VO — 11 segments, Kokoro af_heart (Apache-2.0, PUBLISH voice),
on a 64s timeline. Word timings come from Kokoro's token timestamps when available, else by
character-position interpolation within each segment (segment starts are exact either way).
Writes into out/dispatch/audio/: vo60.wav, timing60.json, words60.json (read by dispatch_core).
Chunks caption cues so spelled-out numbers stay whole and no payoff word is stranded (anti-orphan)."""
import os, json
import numpy as np
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__)); AUD = os.path.join(HERE, "audio")
os.makedirs(AUD, exist_ok=True)
SR = 24000; OUT_SR = 44100; FPS = 30; LEAD = 0.42; TOTAL = 64.0
VOICE = "af_heart"; SPEED = 1.15

# Segments follow the beat map (storyboard rev3). Numbers phonetic. No dashes, no semicolons.
# gap = pause AFTER the segment (breathing room aligned to the picture's cuts)
SEG = [
 ("The AI industry just asked Alaska for forty seven hundred acres.",                        0.45),
 ("This spring the Air Force offered land at three bases for AI data centers, and proposals closed in late June.", 0.42),
 ("The catch is power. One large data center can draw the electricity of a hundred thousand homes.", 0.30),
 ("That's roughly every house Chugach serves around Anchorage.",                             0.32),
 ("Neighbors next door are already wary.",                                                   0.45),
 ("The utility beside Eielson can't feed one today. Cook Inlet gas fell from about thirty percent of its fuel to under one percent.", 0.38),
 ("At points last winter it burned at least two hundred fifty thousand gallons of diesel a day.", 0.45),
 ("The fix is a hundred twenty million dollar turbine.",                                     0.22),
 ("But turbine construction costs are up one hundred ninety five percent since twenty nineteen, because data centers everywhere are buying them too.", 0.25),
 ("So nothing is awarded, and nothing is built.",                                            0.42),
 ("Alaska holds the land, the cold, and the choice.",                                        0.0),
]

_NUMW = {"zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve",
         "thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen","twenty","thirty",
         "forty","fifty","sixty","seventy","eighty","ninety","hundred","thousand","million","billion","point"}
def _isnum(w):
    wl = w.strip(".,;:").lower(); return wl in _NUMW or any(c.isdigit() for c in wl)

def chunk_phrases(spans, maxw=6):
    """spans: [(word, s, e)] for one segment -> caption cues of <=maxw words; spelled-out numbers
    stay whole; never strand a lone final word."""
    n = len(spans)
    if n == 0: return []
    nobreak = [k > 0 and _isnum(spans[k][0]) and _isnum(spans[k - 1][0]) for k in range(n)]
    bounds = []; i = 0
    while i < n:
        j = min(i + maxw, n)
        while j < n and nobreak[j]: j += 1
        if n - j == 1: j = n
        bounds.append((i, j)); i = j
    out = []
    for (i, j) in bounds:
        g = spans[i:j]
        out.append({"w": " ".join(x[0] for x in g), "s": round(g[0][1], 3), "e": round(g[-1][2], 3)})
    return out

from kokoro import KPipeline
pipe = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M")

clips = []; segwords = []
for i, (text, gap) in enumerate(SEG, 1):
    audio_parts = []; tokens = []
    t_off = 0.0
    for r in pipe(text, voice=VOICE, speed=SPEED):
        a = r.audio.numpy() if hasattr(r.audio, "numpy") else np.asarray(r.audio)
        # collect token timestamps when the pipeline provides them
        toks = getattr(r, "tokens", None)
        if toks:
            for tk in toks:
                st = getattr(tk, "start_ts", None); et = getattr(tk, "end_ts", None)
                txt = (getattr(tk, "text", "") or "").strip()
                if txt and st is not None and et is not None:
                    tokens.append((txt, t_off + float(st), t_off + float(et)))
        t_off += len(a) / SR
        audio_parts.append(a.astype(np.float32))
    clip = np.concatenate(audio_parts) if audio_parts else np.zeros(1, np.float32)
    dur = len(clip) / SR
    words = text.split()
    if tokens and len(tokens) >= max(2, len(words) // 2):
        # merge sub-word tokens onto whitespace words by consuming characters
        spans = []; ti = 0
        for w in words:
            target = w.strip(".,;:!?").lower(); acc = ""; s0 = None; e0 = None
            while ti < len(tokens) and len(acc) < len(target):
                tt, ts_, te_ = tokens[ti]
                acc += tt.strip(".,;:!?").lower()
                s0 = ts_ if s0 is None else s0; e0 = te_; ti += 1
            if s0 is None:
                frac0 = len(spans) / max(1, len(words)); s0 = dur * frac0; e0 = dur * (frac0 + 1.0 / len(words))
            spans.append((w, s0, e0))
    else:
        # char-position interpolation fallback
        total = sum(len(w) + 1 for w in words); acc = 0; spans = []
        for w in words:
            a0 = dur * acc / total; acc += len(w) + 1; b0 = dur * acc / total
            spans.append((w, a0, b0))
    clips.append((clip, dur, gap)); segwords.append(spans)
    print(f"s{i}: {dur:.2f}s words={len(spans)} tok={len(tokens)}")

# lay out on the 64s timeline
N = int(TOTAL * SR); buf = np.zeros(N, np.float32)
t = LEAD; starts = []; beats = []; words = []
for i, ((clip, dur, gap), spans) in enumerate(zip(clips, segwords)):
    s = int(t * SR); starts.append(round(t, 3)); beats.append(round(t * FPS))
    e = min(s + len(clip), N); buf[s:e] += clip[:e - s]
    for ph in chunk_phrases([(w, t + a, t + b) for (w, a, b) in spans], maxw=6):
        ph["seg"] = i; words.append(ph)
    t += dur + gap
speech_end = t - SEG[-1][1] if SEG[-1][1] else t
print("speech_end", round(speech_end, 2), "of", TOTAL)
assert speech_end <= 58.5, f"VO too long ({speech_end:.1f}s): raise SPEED or trim"

# resample 24k -> 44.1k and normalize to -1.5 dBTP
n_out = int(len(buf) * OUT_SR / SR)
x_old = np.linspace(0, 1, len(buf)); x_new = np.linspace(0, 1, n_out)
buf44 = np.interp(x_new, x_old, buf).astype(np.float32)
buf44 = buf44 / (np.max(np.abs(buf44)) + 1e-9) * (10 ** (-1.5 / 20))
wavfile.write(os.path.join(AUD, "vo60.wav"), OUT_SR, (np.stack([buf44, buf44], 1) * 32767).astype(np.int16))
json.dump({"starts": starts, "beats": beats, "durs": [c[1] for c in clips], "speech_end": round(speech_end, 3),
           "total": TOTAL, "fps": FPS}, open(os.path.join(AUD, "timing60.json"), "w"), indent=2)
json.dump({"words": words, "speech_end": round(speech_end, 3), "total": TOTAL, "fps": FPS},
          open(os.path.join(AUD, "words60.json"), "w"), indent=2)
print(f"wrote vo60.wav ({TOTAL}s), timing60.json, words60.json ({len(words)} cues)")
