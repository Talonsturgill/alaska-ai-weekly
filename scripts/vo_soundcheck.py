#!/usr/bin/env python3
"""VO SOUND CHECK — the QC gate that enforces docs/craft/VO_DIRECTION.md on a
Gemini TTS take. Given a rendered wav and the intended SPOKEN script, it scores:

  1. word_accuracy  — ASR-transcribe (faster-whisper) and compare to the script.
                      Catches dropped/added words and the 500 "text instead of
                      audio" fallback. (1 - WER)
  2. no_leak        — the transcript must NOT contain any tag word or director's-
                      note word (e.g. "whispers", "director", "transcript"). Catches
                      vocalized-markup / notes-read-aloud failures.
  3. expressive     — pitch (f0) std-dev in semitones must clear a monotone floor.
                      A flat read is the robotic tell; this enforces tone fluctuation.
  4. duration       — within the target window (pace on target).
  5. loudness       — integrated LUFS within a broadcast-safe band.

Usage (single take):
  python scripts/vo_soundcheck.py --audio take.wav --script "the spoken words" [--json]
Programmatic:
  from vo_soundcheck import check, pick_best
  rep = check(wav_path, spoken_text, tags=[...])
  best_idx, reports = pick_best([w1,w2,w3], spoken_text, tags=[...])
"""
import argparse, json, os, re, sys, time
from collections import Counter

# THE DURATION WINDOW IS READ FROM CONFIG, NOT HARDCODED (2026-07-30). It used to be a
# literal dur_hi=75.0, which silently became a run-breaker the moment the format went from
# 60s to 90s: a conforming 90s read is 84 to 96 seconds of audio, so EVERY take would have
# failed the PACE check, pick_best would have returned a failing take, and the routine
# forbids shipping one. Deriving it from config/state.yaml means the next format change
# cannot strand this file behind it.
def _duration_window():
    lo, hi = 8.0, 75.0
    try:
        import yaml
        cfg = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "config", "state.yaml")
        band = (yaml.safe_load(open(cfg)) or {}).get("dispatch_seconds_band")
        if band and len(band) == 2:
            # DELIBERATELY WIDE. The gate that owns exact runtime is Phase 7; this check
            # only needs to catch a take that is GROSSLY broken, a TTS truncation or a
            # runaway loop. Making it tight here just burns re-synths on takes the runtime
            # gate would have accepted.
            lo, hi = max(8.0, float(band[0]) * 0.55), float(band[1]) * 1.35
    except Exception:
        pass
    return lo, hi

DUR_LO, DUR_HI = _duration_window()


def _target_band():
    """The TIGHT band and target the format actually wants, straight from config.

    Distinct from _duration_window() above, which is the deliberately-wide sanity check.
    This is what take SELECTION uses (see pick_best), and until 2026-08-05 nothing in
    code read it at all: `dispatch_target_seconds` and the tight `dispatch_seconds_band`
    existed only as prose for the routine prompt to honour by hand.
    """
    lo, hi, target = None, None, None
    try:
        import yaml
        cfg = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "config", "state.yaml")
        c = yaml.safe_load(open(cfg)) or {}
        band = c.get("dispatch_seconds_band")
        if band and len(band) == 2:
            lo, hi = float(band[0]), float(band[1])
        if c.get("dispatch_target_seconds"):
            target = float(c["dispatch_target_seconds"])
    except Exception:
        pass
    if target is None and lo is not None:
        target = (lo + hi) / 2
    return lo, hi, target

# tolerances (tuned for a ~55s brisk social VO)
WER_MAX = 0.08          # <= 8% word error
PITCH_STD_MIN = 1.6     # semitones; below this = monotone
LUFS_MIN, LUFS_MAX = -20.0, -12.0
VOICED_MIN = 0.35       # at least this fraction voiced (not silence/noise)
NOTE_WORDS = {"transcript", "director", "profile", "narrator", "audio", "preamble", "aloud"}


def _year_words(n):
    """Natural date reading for a 4-digit number, MATCHING HOUSE SCRIPT CONVENTION.

    The script is always spelled out in words (VO_DIRECTION mandates it) and only the
    ASR transcript contains digits, so this function's only job is to turn whisper's
    digits into the words a house script would have used. Getting that mapping wrong
    scores word errors against a take that said exactly the right sentence.

    It was wrong for two whole decades' worth of numbers (fixed 2026-08-05, measured on
    a 288-word probe). The rule was "two 2-digit groups" for everything from 1000 to
    2999, which is correct for 2024 ('twenty twenty four') and wrong for:

      2008  ->  gave 'twenty eight'.   House scripts write 'two thousand eight', and
                every Dispatch that cites a paper year hits this. The 2026-08-05 script
                said 'two thousand eight' and 'two thousand six'; both scored as errors.
      1,000 ->  gave 'ten hundred'. A round thousand is a QUANTITY, not a year, and this
                format puts a round thousand in almost every script ('about a thousand
                species a decade'). Three separate instances in one probe script.

    Those two bugs alone contributed most of a 0.074 WER against a 0.08 fail ceiling, so
    a clean take was one mishearing away from a spurious re-synth. At 288 words there are
    simply more numbers for it to happen to, which is why a latent bug became a blocker.
    """
    from num2words import num2words
    words = lambda k: num2words(k).replace("-", " ").replace(" and ", " ").split()
    # A round thousand reads as a quantity. Nobody says "ten hundred".
    if n % 1000 == 0:
        return words(n)
    # 2000-2009 reads "two thousand eight", not "twenty oh eight" or "twenty eight".
    if 2000 <= n <= 2009:
        return words(n)
    hi, lo = n // 100, n % 100
    return words(hi) + (["hundred"] if lo == 0 else words(lo))


def _canon_token(tok):
    """Canonicalize a token so spelling differences (500 vs five hundred, A.I. vs
    AI, 28th vs twenty eighth, 2024 vs twenty twenty four) don't count as word
    errors. Digits -> words via num2words; leave the rest."""
    t = tok.strip("+%").replace(",", "")
    m = re.match(r"^(\d+)(st|nd|rd|th)$", t)
    # DECIMALS. "1.6" fails isdigit(), so it used to pass through verbatim while the
    # script said "one point six", scoring three word errors on the one token that
    # matters most in a funding story. Every Dispatch has a money figure in it.
    dec = re.match(r"^(\d+)\.(\d+)$", t)
    try:
        from num2words import num2words
        if dec:
            whole = num2words(int(dec.group(1))).replace("-", " ").replace(" and ", " ").split()
            frac = [num2words(int(d)) for d in dec.group(2)]
            return whole + ["point"] + frac
        if m:
            return num2words(int(m.group(1)), to="ordinal").replace("-", " ").replace(" and ", " ").split()
        if t.isdigit():
            n = int(t)
            if 1000 <= n <= 2999 and len(t) == 4:
                return _year_words(n)
            return num2words(n).replace("-", " ").replace(" and ", " ").split()
    except Exception:
        return [tok]
    return [tok]


def _norm_words(s, aliases=None):
    s = s.lower()
    # currency/percent SYMBOLS carry a spoken word that a bare regex strip would
    # silently drop ("$50,000" -> heard has no "dollars"; "60%" -> no "percent"),
    # inflating WER on every number-heavy script (this format has one every run).
    # SCALED CURRENCY FIRST. "$1.6 million" under the bare rule below became
    # "1.6 dollars million", i.e. the spoken word landed in the wrong place and the
    # scale word was orphaned, so a take that said exactly the right sentence scored
    # two more errors on top of the decimal. Whisper writes money this way every time.
    s = re.sub(r"\$\s?(\d[\d,]*(?:\.\d+)?)\s+(million|billion|trillion|thousand)",
               r"\1 \2 dollars", s)
    s = re.sub(r"\$\s?(\d[\d,]*(?:\.\d+)?)", r"\1 dollars", s)
    s = re.sub(r"(\d)\s?%", r"\1 percent", s)
    # DECIMALS BEFORE THE STRIP. The general regex below replaces every non
    # [a-z0-9\'] character with a space, so "1.6" became "1 6" and the decimal branch
    # in _canon_token could never see a dot. Spell it out here, while the dot exists.
    def _dec(m):
        try:
            from num2words import num2words
            whole = num2words(int(m.group(1))).replace("-", " ").replace(" and ", " ")
            frac = " ".join(num2words(int(d)) for d in m.group(2))
            return f" {whole} point {frac} "
        except Exception:
            return m.group(0)
    s = re.sub(r"(?<![\d.])(\d+)\.(\d+)(?![\d.])", _dec, s)

    # thousands-separator commas glue a number into one token ("50,000" is ONE
    # value); stripped by the general regex below they'd split into "50" + "000"
    # and canonicalize as "fifty" + "zero" instead of "fifty thousand".
    s = re.sub(r"(?<=\d),(?=\d{3}\b)", "", s)
    # GLUED NAME+DIGITS ("web907", "mp3"): Whisper writes a brand as one alphanumeric token while
    # the script speaks "web nine oh seven". Read the digits one at a time (0 as "oh"), the way a
    # brand's number is said, on BOTH sides, so a correct read of "Web nine oh seven" is not a WER
    # error (2026-10-06, a Web 907 film failed every take on this alone). A possessive and its bare
    # plural ("vick's" / "vicks") are the same ASR-dropped apostrophe, so both normalize to one form.
    _DIG = {"0": "oh", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five",
            "6": "six", "7": "seven", "8": "eight", "9": "nine"}
    s = re.sub(r"\b([a-z]{2,})(\d{2,4})\b",
               lambda m: m.group(1) + " " + " ".join(_DIG[d] for d in m.group(2)), s)
    s = re.sub(r"(?<=[a-z])'s\b", "s", s)
    raw = [w for w in re.sub(r"[^a-z0-9' ]", " ", s).split() if w]
    expanded = []
    for w in raw:
        expanded.extend(_canon_token(w))
    # collapse runs of single letters into one word: a i -> ai, u a f -> uaf
    out, run = [], []
    for w in expanded:
        if len(w) == 1 and w.isalpha():
            run.append(w)
        else:
            if run:
                out.append("".join(run)); run = []
            out.append(w)
    if run:
        out.append("".join(run))
    # SPOKEN ALIASES ARE DERIVED, NOT CURATED (machine pass 2026-10-03). Until today
    # this held a hand-written _SPOKEN map ("noah" -> "noaa", "odolith" -> "otolith") and
    # a curated _COMPOUNDS pair list, each grown one entry per run after every take of
    # that run had already failed (07-18, 07-19, 07-20, 10-02). The three shapes are now
    # general: aliases come from the run's own pronunciation map (spoken_aliases), split
    # compounds are joined against the other side's vocabulary (_join_compounds), and a
    # flapped t heard as d is a match inside a long word (_flap_equal). See _wer.
    if aliases is None:
        aliases = _default_aliases()
    out = [aliases.get(w, w) for w in out]
    phrases = sorted(((k, v) for k, v in aliases.items() if isinstance(k, tuple)),
                     key=lambda kv: -len(kv[0]))
    return _apply_phrases(out, phrases) if phrases else out


def _apply_phrases(words, phrases):
    """Replace each heard phrase (a tuple of tokens) with its written tokens, longest first,
    left to right. Used on BOTH sides of the WER, like every alias, so it can only cancel a
    mishearing the run declared and never forgive a dropped word."""
    out, i = [], 0
    while i < len(words):
        for k, v in phrases:
            if tuple(words[i:i + len(k)]) == k:
                out.extend(v)
                i += len(k)
                break
        else:
            out.append(words[i])
            i += 1
    return out


# THE RUN'S PRONUNCIATION MAP IS THE ALIAS LIST. vo_direction.json tells the voice to
# say NOAA as "Noah"; the voice obeys and Whisper writes "Noah". The written word and
# its directed reading are therefore one word for scoring, on BOTH sides, so a script
# that happens to contain the spoken form is treated identically and nothing else is
# forgiven. A syllable respelling ("OH-toh-lith") has a different token count from its
# word and is skipped: Whisper never writes syllables, and the flap rule covers what it
# does write for those.
_DIRECTION = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "out", "dispatch",
                          "vo_direction.json")


def spoken_aliases(pronunciations):
    """{spoken token: written token} from a vo_direction `pronunciations` map."""
    out = {}
    for written, spoken in (pronunciations or {}).items():
        w = _norm_words(str(written), aliases={})
        sp = _norm_words(str(spoken), aliases={})
        if not w or len(w) != len(sp):
            continue
        for a, b in zip(sp, w):
            if a != b:
                out[a] = b
                if a.endswith("'s"):
                    out[a[:-2] + "s"] = b       # Whisper drops the apostrophe: "Noahs"
    return out


def heard_aliases(heard):
    """{heard phrase tuple: written tuple} from a vo_direction `heard` map.

    Machine pass 2026-10-29 (asr-proper-noun-wer). The pronunciation map does two jobs: it
    tells the voice how to say a name, and it is the WER alias list. On 10-29 every take of a
    script carrying AIDEA, NuCube, NuSun, Oklo, Eielson and Enstar scored WER 0.10 to 0.12
    against the 0.08 ceiling, because the voice said "eye-DEE-uh" and Whisper wrote "Idea",
    "Newcube", "new sun", "o-close", and syllable respellings are skipped as aliases. The run
    passed only by rewriting the DIRECTION to Whisper's spellings, which changes what the voice
    is told to say to suit the scorer. `heard` is the scorer's own list, kept apart:
    {"NuSun": ["new sun"], "Oklo": ["o-close"]}, any token count, possessive included.
    `python3 scripts/vo_soundcheck.py --suggest-heard` fills it from a take's ASR text."""
    out = {}
    for written, forms in (heard or {}).items():
        w = tuple(_norm_words(str(written), aliases={}))
        if not w:
            continue
        for form in ([forms] if isinstance(forms, str) else forms or []):
            h = tuple(_norm_words(str(form), aliases={}))
            if h and h != w:
                out[h] = w
                if not h[-1].endswith("s") and not w[-1].endswith("s"):
                    out[h[:-1] + (h[-1] + "s",)] = w[:-1] + (w[-1] + "s",)   # AIDEA's, "Ideas"
    return out


def direction_aliases(direction):
    """Every alias a vo_direction dict declares: its pronunciations and its heard map."""
    direction = direction or {}
    out = spoken_aliases(direction.get("pronunciations"))
    out.update(heard_aliases(direction.get("heard")))
    return out


def suggest_heard(script_text, heard_text, names):
    """{name: [heard forms]} for each name the ASR wrote differently, aligned word by word.

    Reads the take's own transcript, so the vo-director copies what Whisper wrote rather than
    guessing. Only a span that is exactly the name (or its possessive) on the script side is
    proposed, so a neighbouring dropped word is never folded into an alias."""
    import difflib
    r = _norm_words(script_text, aliases={})
    h = _norm_words(heard_text, aliases={})
    want = {}
    for n in names:
        t = tuple(_norm_words(str(n), aliases={}))
        if t:
            want[t] = n
            want[t[:-1] + (t[-1] + "s",)] = n
    out = {}
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, r, h, autojunk=False).get_opcodes():
        name = want.get(tuple(r[i1:i2]))
        if op == "replace" and name and j2 > j1:
            form = " ".join(h[j1:j2])
            if form.endswith("s") and tuple(r[i1:i2]) != tuple(_norm_words(str(name), aliases={})):
                form = form[:-1]                          # the possessive's base form
            out.setdefault(name, [])
            if form not in out[name]:
                out[name].append(form)
    return out


def _default_aliases():
    try:
        return direction_aliases(json.load(open(_DIRECTION)))
    except Exception:
        return {}


def _join_compounds(words, vocab):
    """Join a split pair wherever its concatenation is a word in `vocab`.

    Whisper writes "ear stones" as "earstones" and "airstrip" as "air strip". _wer passes
    the UNION of both sides' words and applies the same join to both, so it can only
    cancel a tokenization mismatch, never invent a word: a pair is joined everywhere or
    nowhere, and a dropped word leaves nothing to join."""
    out, i = [], 0
    while i < len(words):
        if i + 1 < len(words) and words[i] + words[i + 1] in vocab:
            out.append(words[i] + words[i + 1]); i += 2
        else:
            out.append(words[i]); i += 1
    return out


_VOWELS = set("aeiouy")


def _flap_equal(a, b):
    """An American flapped t reads to Whisper as a d ("otoliths" -> "odoliths"). Accept a
    t/d swap only between vowels, never at either end, and only in a word longer than five
    letters, so "ten"/"den" and "bat"/"bad" still count as errors."""
    if a == b:
        return True
    if len(a) != len(b) or len(a) <= 5:
        return False
    diff = [i for i in range(len(a)) if a[i] != b[i]]
    return bool(diff) and all(
        {a[i], b[i]} == {"t", "d"} and 0 < i < len(a) - 1
        and a[i - 1] in _VOWELS and a[i + 1] in _VOWELS for i in diff)


def _wer(ref, hyp, aliases=None):
    r, h = _norm_words(ref, aliases), _norm_words(hyp, aliases)
    vocab = set(r) | set(h)
    r, h = _join_compounds(r, vocab), _join_compounds(h, vocab)
    if not r:
        return 0.0
    # Levenshtein over word lists
    dp = list(range(len(h) + 1))
    for i in range(1, len(r) + 1):
        prev, dp[0] = dp[0], i
        for j in range(1, len(h) + 1):
            cur = dp[j]
            dp[j] = min(dp[j] + 1, dp[j - 1] + 1, prev + (not _flap_equal(r[i - 1], h[j - 1])))
            prev = cur
    return dp[len(h)] / len(r)


def _transcribe(wav):
    print("soundcheck ASR: importing backend", file=sys.stderr, flush=True)
    from faster_whisper import WhisperModel
    print("soundcheck ASR: loading base model", file=sys.stderr, flush=True)
    m = WhisperModel("base", device="cpu", compute_type="int8")
    print("soundcheck ASR: model loaded; decoding audio", file=sys.stderr, flush=True)
    segs, _ = m.transcribe(wav, language="en", vad_filter=False)
    text = []
    for segment in segs:
        text.append(segment.text.strip())
        print(f"soundcheck ASR: decoded through {segment.end:.1f}s", file=sys.stderr, flush=True)
    return " ".join(text)


def _pitch_std_semitones(wav):
    import librosa
    import numpy as np
    y, sr = librosa.load(wav, sr=22050, mono=True)
    f0, voiced, _ = librosa.pyin(y, fmin=70, fmax=400, sr=sr,
                                 frame_length=2048, hop_length=256)
    v = f0[~np.isnan(f0)]
    voiced_frac = float(len(v)) / max(1, len(f0))
    if len(v) < 10:
        return 0.0, voiced_frac, len(y) / sr
    semis = 12.0 * np.log2(v / np.median(v))
    return float(np.std(semis)), voiced_frac, len(y) / sr


def _lufs(wav):
    import soundfile as sf
    import pyloudnorm as pyln
    data, rate = sf.read(wav)
    if data.ndim > 1:
        data = data.mean(axis=1)
    meter = pyln.Meter(rate)
    return float(meter.integrated_loudness(data))


def check(wav, spoken_text, tags=None, dur_lo=None, dur_hi=None, aliases=None):
    dur_lo = DUR_LO if dur_lo is None else dur_lo
    dur_hi = DUR_HI if dur_hi is None else dur_hi
    tags = tags or []
    started = time.monotonic()
    print(f"soundcheck {os.path.basename(wav)}: transcribing", file=sys.stderr, flush=True)
    heard = _transcribe(wav)
    print(f"soundcheck {os.path.basename(wav)}: ASR complete after {time.monotonic()-started:.1f}s; pitch analysis", file=sys.stderr, flush=True)
    wer = _wer(spoken_text, heard, aliases)
    # A LEAK IS AN EXCESS, NOT A PRESENCE (2026-09-23). This was a set intersection of
    # tag words against heard words, with no reference to the script, so any tag word that
    # is ALSO a real word in the writing failed the take no matter how the model read it.
    # It cost a clean Gemini take today: the direction used "[short pause]" and the script
    # says "Fairbanks asked for a pause on both its state and federal lists", so the gate
    # reported the model had spoken a tag it never spoke, on a take whose word error rate
    # was 3.7 percent. A spoken tag ADDS occurrences, so counting is what separates the two,
    # and the gate keeps its teeth: say "[short pause]" aloud and "pause" exceeds the
    # script's own count immediately.
    heard_counts = Counter(_norm_words(heard, aliases))
    script_counts = Counter(_norm_words(spoken_text, aliases))
    tag_words = set(w for t in tags for w in _norm_words(t))
    leaked = sorted(w for w in (tag_words | NOTE_WORDS)
                    if heard_counts[w] > script_counts.get(w, 0))
    pstd, voiced, dur = _pitch_std_semitones(wav)
    print(f"soundcheck {os.path.basename(wav)}: pitch complete after {time.monotonic()-started:.1f}s; loudness", file=sys.stderr, flush=True)
    try:
        lufs = _lufs(wav)
    except Exception:
        lufs = None

    checks = {
        "word_accuracy": {"wer": round(wer, 3), "pass": wer <= WER_MAX},
        "no_leak": {"leaked": leaked, "pass": len(leaked) == 0},
        "expressive": {"pitch_std_semitones": round(pstd, 2), "voiced_frac": round(voiced, 2),
                       "pass": pstd >= PITCH_STD_MIN and voiced >= VOICED_MIN},
        "duration": {"seconds": round(dur, 2), "pass": dur_lo <= dur <= dur_hi},
        "loudness": {"lufs": None if lufs is None else round(lufs, 1),
                     "pass": lufs is None or LUFS_MIN <= lufs <= LUFS_MAX},
    }
    # score = accuracy + expressiveness headroom, penalized hard for leaks
    score = (1 - wer) * 0.5 + min(pstd / 4.0, 1.0) * 0.4 + (0.1 if not leaked else -0.5)
    passed = all(c["pass"] for c in checks.values())
    return {"pass": passed, "score": round(score, 3), "heard": heard, "checks": checks,
            "diagnosis": _diagnose(checks)}


def _diagnose(c):
    if not c["no_leak"]["pass"]:
        return f"LEAK: model spoke {c['no_leak']['leaked']} — remove those inline tags, move emotion to the notes, re-synth."
    if not c["word_accuracy"]["pass"]:
        return (f"WORDS: WER {c['word_accuracy']['wer']} too high (dropped/garbled or a 500 text-fallback) — re-roll. "
                f"If the misses are directed names, run `python3 scripts/vo_soundcheck.py --suggest-heard` first, "
                f"add its `heard` map to vo_direction.json and re-score the same takes with VO_REUSE_TAKES=1.")
    if not c["expressive"]["pass"]:
        return f"MONOTONE: pitch std {c['expressive']['pitch_std_semitones']} st below floor {PITCH_STD_MIN} — add ENERGY CONTRAST between adjacent lines (VO_DIRECTION step 5), then re-synth."
    if not c["duration"]["pass"]:
        return f"PACE: {c['duration']['seconds']}s out of window — adjust the brisk-pace note."
    if not c["loudness"]["pass"]:
        return f"LEVEL: {c['loudness']['lufs']} LUFS out of band — normalize in the mix."
    return "clean"


def pick_best(wavs, spoken_text, tags=None, aliases=None):
    """Choose the take to ship: quality first, but RUNTIME IS A SELECTION CRITERION.

    WHY (2026-08-05, measured during the 90s -> 120s upgrade). Take-to-take duration
    spread on an IDENTICAL prompt is large and quality spread is not. The 2026-08-05
    run's three takes ran 86.6 / 86.8 / 97.4 seconds, a 12.5 percent spread, while their
    quality scores were 0.963 / 0.969 / 0.967, a spread of 0.006. Selecting on score
    alone therefore picked the runtime essentially at random, out of a set that contained
    a take much closer to the format's target.

    That was survivable at 90 seconds and is not at 120. The longer the piece, the more
    of the runtime band a single stochastic take can eat, and runtime is the one thing
    the format promises. So: among takes that PASS, prefer the ones inside the tight band
    from config/state.yaml, and let quality decide within that set. If none is in band,
    take the passing one closest to target rather than the most expressive one.

    Quality is never traded away. A failing take is still never preferred to a passing
    one, and the in-band set is still ranked by the same score as before.
    """
    reports = [check(w, spoken_text, tags, aliases=aliases) for w in wavs]
    for r, w in zip(reports, wavs):
        r["seconds"] = r["checks"]["duration"]["seconds"]
    passing = [i for i, r in enumerate(reports) if r["pass"]]
    pool = passing or list(range(len(reports)))

    lo, hi, target = _target_band()
    if lo is None:
        best = max(pool, key=lambda i: reports[i]["score"])
    else:
        inband = [i for i in pool if lo <= reports[i]["seconds"] <= hi]
        if inband:
            best = max(inband, key=lambda i: reports[i]["score"])
        else:
            best = min(pool, key=lambda i: abs(reports[i]["seconds"] - target))
        for i, r in enumerate(reports):
            r["in_target_band"] = lo <= r["seconds"] <= hi
        reports[best]["selection"] = (
            f"in the {lo:.0f}-{hi:.0f}s band, best quality of {len(inband)} in-band take(s)"
            if inband else
            f"NO take landed in {lo:.0f}-{hi:.0f}s; chose the one closest to {target:.0f}s")
    return best, reports


def _self_test():
    """Each case is a defect this canonicalizer once had, or a mishearing it must still
    count. Then the 10-02 shipped take is re-scored from the archive with aliases derived
    from that run's own vo_direction.json, which is the proof the curated lists are gone
    without the takes failing again."""
    fails = []

    def eq(name, got, want):
        ok = got == want if not isinstance(want, tuple) else want[0] <= got <= want[1]
        print(f"  [{'x' if ok else ' '}] {name}: {got!r}")
        if not ok:
            fails.append(f"{name}: got {got!r}, want {want!r}")

    noaa = spoken_aliases({"NOAA": "Noah", "NOAA's": "Noah's", "otolith": "OH-toh-lith",
                           "Herz": "hurts"})
    # _norm_words folds a possessive to its bare plural on both sides since 2026-10-06, so the
    # derived possessive alias is "noahs" -> "noaas" (the apostrophe form can't occur).
    eq("pronunciation map -> aliases", noaa,
       {"noah": "noaa", "noahs": "noaas", "hurts": "herz"})
    eq("directed NOAA heard as Noah is no error",
       _wer("NOAA scientists count the rings", "Noah scientists count the rings", noaa), 0.0)
    eq("without the map it is one error",
       _wer("NOAA scientists count the rings", "Noah scientists count the rings", {}), 0.2)
    eq("a real mishearing still counts with the map",
       _wer("NOAA scientists count the rings", "Noah scientists count the wings", noaa), 0.2)
    eq("split compound joined against the other side",
       _wer("its ear stones say", "its earstones say", {}), 0.0)
    eq("closed compound heard split", _wer("a remote airstrip", "a remote air strip", {}), 0.0)
    eq("a dropped word is not joined away", _wer("its ear stones say", "its ear say", {}), 0.25)
    eq("flapped t inside a long word", _wer("tiny otoliths", "tiny odoliths", {}), 0.0)
    eq("t/d at a word edge still counts", _wer("the bat", "the bad", {}), 0.5)
    eq("t/d in a short word still counts", _wer("the metal", "the medal", {}), 0.5)
    eq("money and percent still canonical",
       _wer("$1.6 million, 60%", "1.6 million dollars 60 percent", {}), 0.0)
    eq("no curated alias survives: noah is a word without a map",
       _norm_words("Noah", aliases={}), ["noah"])

    # THE HEARD MAP (2026-10-29): multi-token and possessive mishearings of a directed name.
    hm = heard_aliases({"NuSun": ["new sun"], "AIDEA": ["idea"], "Oklo": ["o-close"]})
    eq("a two-word hearing of one name is no error",
       _wer("a reactor called NuSun", "a reactor called new sun", hm), 0.0)
    eq("the possessive of a heard name is no error",
       _wer("AIDEA's money counts", "Ideas money counts", hm), 0.0)
    eq("a hyphenated hearing is no error", _wer("Oklo at Eielson", "o-close at Eielson", hm), 0.0)
    eq("a heard map forgives nothing else",
       _wer("a reactor called NuSun", "a reactor called new son", hm), 0.5)
    eq("suggest_heard reads the forms off the transcript",
       suggest_heard("Idaho took money from AIDEA. Its NuSun is small. AIDEA's money counts.",
                     "Idaho took money from Idea. Its new sun is small. Ideas money counts.",
                     ["AIDEA", "NuSun", "Oklo"]),
       {"AIDEA": ["idea"], "NuSun": ["new sun"]})
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
    try:
        # The 10-29 shipped take against its script, with the DIRECTED pronunciations it began
        # with (syllable respellings, so no alias) plus a heard map suggested from its own ASR.
        heard29 = json.load(open(os.path.join(root, "runs/2026-10-29/vo_report.json")))["soundcheck"]["heard"]
        script29 = open(os.path.join(root, "runs/2026-10-29/vo_script.txt")).read().replace("\n", " ")
        names = ["AIDEA", "NuCube", "NuSun", "Oklo", "Eielson", "Enstar"]
        sug = suggest_heard(script29, heard29, names)
        w_raw29 = _wer(script29, heard29, {})
        w_heard29 = _wer(script29, heard29, heard_aliases(sug))
        print(f"  10-29 shipped take: WER {w_raw29:.3f} with syllable pronunciations only, "
              f"{w_heard29:.3f} with the suggested heard map {sug}")
        eq("10-29 take fails without a heard map", w_raw29 > WER_MAX, True)
        eq("10-29 take passes on the heard map suggested from its own ASR", w_heard29 <= WER_MAX, True)
    except Exception as e:                       # archive absent: report, don't fake
        print(f"  [-] 10-29 re-score skipped: {e}")
    try:
        heard = json.load(open(os.path.join(root, "runs/2026-10-02/vo_report.json")))["soundcheck"]["heard"]
        pron = json.load(open(os.path.join(root, "runs/2026-10-02/vo_direction.json")))["pronunciations"]
        import subprocess
        script = subprocess.run(["git", "-C", root, "show", "28b9d93:runs/2026-10-02/vo_script.txt"],
                                capture_output=True, text=True, check=True).stdout.replace("\n", " ")
        w_map = _wer(script, heard, spoken_aliases(pron))
        w_raw = _wer(script, heard, {})
        print(f"  10-02 shipped take vs its synth script: WER {w_map:.3f} with the run's map, "
              f"{w_raw:.3f} without (ceiling {WER_MAX})")
        eq("10-02 take passes on derived aliases", w_map <= WER_MAX, True)
    except Exception as e:                       # archive or git object absent: report, don't fake
        print(f"  [-] 10-02 re-score skipped: {e}")
    print("SELF-TEST", "FAIL" if fails else "PASS")
    for f in fails:
        print("  FAIL", f)
    return 1 if fails else 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--audio")
    ap.add_argument("--script", help="the intended SPOKEN words (no tags/notes)")
    ap.add_argument("--self-test", action="store_true",
                    help="hermetic WER canonicalizer tests, plus a re-score of the 10-02 take")
    ap.add_argument("--tags", default="", help="comma-sep inline tags used, e.g. '[curious],[wry]'")
    ap.add_argument("--direction", default=None,
                    help="vo_direction.json whose pronunciations map is scored as aliases "
                         "(default out/dispatch/vo_direction.json when present)")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--suggest-heard", action="store_true",
                    help="print the `heard` map for vo_direction.json from a take's ASR text "
                         "(--heard-from vo_report.json, --script the spoken text, --direction)")
    ap.add_argument("--heard-from", default=None,
                    help="vo_report.json whose soundcheck.heard is the take's transcript")
    a = ap.parse_args()
    if a.self_test:
        sys.exit(_self_test())
    if a.suggest_heard:
        out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "out", "dispatch")
        rep = json.load(open(a.heard_from or os.path.join(out_dir, "vo_report.json")))
        heard = (rep.get("soundcheck") or rep).get("heard") or ""
        script = a.script or open(os.path.join(out_dir, "vo_script.txt")).read()
        if os.path.exists(script):
            script = open(script).read()
        direction = json.load(open(a.direction or _DIRECTION))
        names = list((direction.get("pronunciations") or {}).keys()) + list((direction.get("heard") or {}).keys())
        sug = suggest_heard(script, heard, dict.fromkeys(names))
        merged = {k: list(dict.fromkeys(list(direction.get("heard", {}).get(k, [])) + v)) for k, v in sug.items()}
        print(json.dumps({"heard": merged}, indent=2))
        print(f"WER {_wer(script, heard, spoken_aliases(direction.get('pronunciations'))):.3f} on the "
              f"pronunciations alone, {_wer(script, heard, {**direction_aliases(direction), **heard_aliases(merged)}):.3f} "
              f"with this heard map (ceiling {WER_MAX}). Add it to vo_direction.json as \"heard\"; "
              f"never rewrite \"pronunciations\" to Whisper's spelling.", file=sys.stderr)
        sys.exit(0)
    if not (a.audio and a.script):
        ap.error("--audio and --script are required")
    tags = [t.strip() for t in a.tags.split(",") if t.strip()]
    aliases = None
    if a.direction:
        aliases = direction_aliases(json.load(open(a.direction)))
    rep = check(a.audio, a.script, tags, aliases=aliases)
    if a.json:
        print(json.dumps(rep, indent=2))
    else:
        v = "PASS" if rep["pass"] else "FAIL"
        print(f"{v}  score={rep['score']}  {rep['diagnosis']}")
        for name, c in rep["checks"].items():
            print(f"  [{'x' if c['pass'] else ' '}] {name}: {({k:v for k,v in c.items() if k!='pass'})}")
        print(f"  heard: {rep['heard'][:160]}")
    sys.exit(0 if rep["pass"] else 1)


if __name__ == "__main__":
    main()
