"""Rebuild audio/words60.json from the EXISTING per-segment VTTs + timing60.json, using the
anti-orphan chunking (never strand a lone final word like 'moves'). Re-uses the already-synthesized
edge-tts subtitles, so vo60.wav / master60.wav / timing60.json are untouched — only the caption
grouping changes. Run before re-rendering (dispatch_core reads words60.json at import)."""
import os, json
HERE = os.path.dirname(os.path.abspath(__file__)); AUD = os.path.join(HERE, "audio")

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

_NUMW = {"zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve",
         "thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen","twenty","thirty",
         "forty","fifty","sixty","seventy","eighty","ninety","hundred","thousand","million","billion","point"}
def _isnum(w):
    wl = w.strip(".,;:").lower(); return wl in _NUMW or any(c.isdigit() for c in wl)
def chunk_phrases(cs, ce, text, maxw=6):
    ws = text.split()
    if not ws: return []
    total = sum(len(w) + 1 for w in ws); acc = 0; spans = []
    for w in ws:
        a = cs + (ce - cs) * acc / total; acc += len(w) + 1; b = cs + (ce - cs) * acc / total
        spans.append((w, a, b))
    n = len(spans)
    nobreak = [k > 0 and _isnum(spans[k][0]) and _isnum(spans[k - 1][0]) for k in range(n)]
    bounds = []; i = 0
    while i < n:
        j = min(i + maxw, n)
        while j < n and nobreak[j]: j += 1             # keep a spelled-out number whole (no partial-number freeze)
        if n - j == 1: j = n                           # never strand a lone final word
        bounds.append((i, j)); i = j
    return [{"w": " ".join(x[0] for x in spans[i:j]), "s": round(spans[i][1], 3), "e": round(spans[j - 1][2], 3)}
            for (i, j) in bounds]

tim = json.load(open(os.path.join(AUD, "timing60.json")))
starts = tim["starts"]; words = []
for i, t0 in enumerate(starts):                        # one VTT per segment (s1..sN)
    vtt = os.path.join(AUD, f"s{i + 1}.vtt")
    for (cs, ce, txt) in parse_vtt(vtt):
        for ph in chunk_phrases(t0 + cs, t0 + ce, txt, maxw=6):
            ph["seg"] = i; words.append(ph)
# show NUMERALS on screen, never a spelled-out partial (unambiguous on a silent read; the audio still speaks them out)
_SUB = [("one thousand seven hundred fifty", "1,750"), ("two thousand two", "2002"), ("seven point nine", "7.9")]
for c in words:
    for a, b in _SUB: c["w"] = c["w"].replace(a, b)
json.dump({"words": words, "speech_end": tim["speech_end"], "total": tim["total"], "fps": tim["fps"]},
          open(os.path.join(AUD, "words60.json"), "w"), indent=2)
# report the limit-beat payoff cue so we can confirm 'moves' now lands whole
tail = [w["w"] for w in words if w["seg"] == 6]
print(f"wrote words60.json: {len(words)} cues; final segment tail cues -> {tail[-3:]}")
