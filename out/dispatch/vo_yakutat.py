"""60s Yakutat-microplate VO — 7 segments, edge-tts draft (varied voice), on a 60s timeline.
Captures per-WORD timings (edge-tts --write-subtitles) so captions are word-synced. Writes into
out/dispatch/audio/: vo60.wav, timing60.json, words60.json (read by dispatch_core at import)."""
import os, subprocess, json
import numpy as np
from scipy.io import wavfile
HERE = os.path.dirname(os.path.abspath(__file__)); AUD = os.path.join(HERE, "audio"); os.makedirs(AUD, exist_ok=True)
VOICE = "en-US-ChristopherNeural"; RATE = "+6%"; SR = 44100; FPS = 30; LEAD = 0.40; GAP = 0.20; TOTAL = 60.0
SEG = [
 "For years, Alaska's ground kept a secret in plain sight.",
 "A machine learning model went back through years of seismic recordings and pulled out about one thousand seven hundred fifty tiny earthquakes nobody had cataloged.",
 "They were not scattered. They fell into one line, two hundred fifty kilometers long, the razor edge of the Yakutat microplate grinding under Alaska.",
 "That edge is a slab of crust diving under the state, and the collision keeps loading the rock around it.",
 "The researchers propose the stress may reach all the way to the Denali Fault, the one that broke in two thousand two at magnitude seven point nine.",
 "The model has a hard limit. It shows you where the edge sits. It can't tell you when it moves.",
 "But knowing where it is makes every hazard map, and every building code, a little more honest.",
]
env = dict(os.environ); env["SSL_CERT_FILE"] = "/etc/ssl/certs/ca-certificates.crt"; env["SSL_CERT_DIR"] = "/etc/ssl/certs"
def run(c): return subprocess.run(c, check=True, capture_output=True, text=True, env=env)
def dur(p): return float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]).stdout)
def load(p):
    w = p[:-4] + ".wav"; run(["ffmpeg", "-y", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "wav", w]); sr, d = wavfile.read(w)
    return (d.astype(np.float32) / 32768.0) if d.dtype == np.int16 else d.astype(np.float32)
def ts(s):
    h, m, rest = s.replace(",", ".").split(":"); return int(h) * 3600 + int(m) * 60 + float(rest)
def parse_vtt(p):
    out = []; lines = open(p, encoding="utf-8").read().splitlines(); i = 0
    while i < len(lines):
        if "-->" in lines[i]:
            a, b = [x.strip() for x in lines[i].split("-->")]; b = b.split()[0]
            txt = lines[i + 1].strip() if i + 1 < len(lines) else ""
            if txt: out.append((ts(a), ts(b), txt))
            i += 2
        else: i += 1
    return out
def chunk_phrases(cs, ce, text, maxw=6):
    """Split a sentence-cue [cs,ce] into readable phrase-cues of <=maxw words, timed by char position."""
    ws = text.split()
    if not ws: return []
    total = sum(len(w) + 1 for w in ws); acc = 0; spans = []
    for w in ws:
        a = cs + (ce - cs) * acc / total; acc += len(w) + 1; b = cs + (ce - cs) * acc / total
        spans.append((w, a, b))
    # group into <=maxw, but NEVER strand a lone final word (keep the payoff phrase whole, e.g. "...when it moves")
    n = len(spans); bounds = []; i = 0
    while i < n:
        j = min(i + maxw, n)
        if n - j == 1: j = n                 # a lone trailing word -> absorb it into this group
        bounds.append((i, j)); i = j
    out = []
    for (i, j) in bounds:
        g = spans[i:j]
        out.append({"w": " ".join(x[0] for x in g), "s": round(g[0][1], 3), "e": round(g[-1][2], 3)})
    return out
durs = []; clips = []; wordseg = []
for i, t in enumerate(SEG, 1):
    mp3 = os.path.join(AUD, f"s{i}.mp3"); vtt = os.path.join(AUD, f"s{i}.vtt")
    run(["edge-tts", "--voice", VOICE, f"--rate={RATE}", "--text", t, "--write-media", mp3, "--write-subtitles", vtt])
    durs.append(dur(mp3)); clips.append(load(mp3)); wordseg.append(parse_vtt(vtt))
    print(f"s{i}: {durs[-1]:.2f}s  words={len(wordseg[-1])}")
N = int(TOTAL * SR); buf = np.zeros(N, np.float32); t = LEAD; beats = []; starts = []; words = []
for i, c in enumerate(clips):
    s = int(t * SR); starts.append(round(t, 3)); beats.append(round(t * FPS)); e = min(s + len(c), N); buf[s:e] += c[:e - s]
    for (cs, ce, txt) in wordseg[i]:
        for ph in chunk_phrases(t + cs, t + ce, txt, maxw=6):
            ph["seg"] = i; words.append(ph)
    t += durs[i] + GAP
speech_end = t - GAP; print("speech_end", round(speech_end, 2), "words", len(words))
buf = buf / (np.max(np.abs(buf)) + 1e-9) * (10 ** (-1.5 / 20))
wavfile.write(os.path.join(AUD, "vo60.wav"), SR, (np.stack([buf, buf], 1) * 32767).astype(np.int16))
json.dump({"starts": starts, "beats": beats, "durs": durs, "speech_end": speech_end, "total": TOTAL, "fps": FPS},
          open(os.path.join(AUD, "timing60.json"), "w"), indent=2)
json.dump({"words": words, "speech_end": speech_end, "total": TOTAL, "fps": FPS},
          open(os.path.join(AUD, "words60.json"), "w"), indent=2)
print("wrote vo60.wav, timing60.json, words60.json")
