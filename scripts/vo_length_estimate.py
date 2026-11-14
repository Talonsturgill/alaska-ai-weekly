#!/usr/bin/env python3
"""Predict the VO runtime from the SCRIPT, before spending a synth on it.

WHY THIS EXISTS (2026-08-09, and it cost this run a full re-synth round).
-----------------------------------------------------------------------
config/state.yaml carries `dispatch_vo_words_band`, and the routine treats it as the length
control: write inside the band and the read lands inside `dispatch_seconds_band`. That works
for a script of ordinary sentence length and it silently does not work otherwise.

This run wrote 281 words, comfortably inside the 262 to 282 band, and the first synth came
back at 146.5 seconds against a 112 to 130 ceiling. Nothing was wrong with the prompt: the
Pace paragraph was verbatim, the model was the primary one, the take was clean. The script
simply had 35 SENTENCES in 281 words, because this film's voice is short and declarative, and
the required Pace paragraph instructs the reader to "take a real breath at every period". Every
period is therefore a cost, and a word band cannot see periods.

THE MODEL, and it is honestly a TWO-POINT FIT, not a study:

    seconds = 0.4345 * words + 0.6974 * sentences

Both points are real synths of this run, same voice, same model, same verbatim Pace paragraph:

    281 words / 35 sentences -> 146.5 s   (measured, take 0 of the first synth)
    257 words / 24 sentences -> 128.4 s   (measured, the delivered take)

Two points fix two coefficients exactly, so the fit reproduces its own inputs by construction
and that is not evidence. What it IS good for is the DIRECTION and the ROUGH SIZE of the
sentence cost, which is the thing the words band cannot express at all: about 0.7 seconds per
sentence, which is roughly a word and a half. A script of 270 words in 20 sentences and one of
270 words in 40 sentences differ by about 14 seconds, and that is most of the band.

TREAT THE OUTPUT AS A STEER, NOT A GATE. It exits 0 always, on purpose. It is here so a run
finds out before it pays for a synth, not so it can refuse one. Add a third and fourth measured
point to POINTS below whenever a run measures a take, and re-solve.

    python3 scripts/vo_length_estimate.py [path/to/vo_script.txt]

REFITTED FROM THE ARCHIVE EVERY CALL (machine pass 2026-11-14, queue: vo-length-model-overshoots).
The two 08-09 points stayed the whole model for three months while the voice, model and Pace
paragraph changed under it. Over the 32 shipped films with a vo_script.txt and a vo_report.json the
two-point model predicted 16.0 s too long on average (MAE 16.2 s): 11-14 was told 137.4 s for a
take that ran 122.4, so a run trims facts that fit. And config/state.yaml's words band read 200 to
220 while every film shipped since 10-05 ran 249 to 325 words inside the seconds band. So the
coefficients are now least squares over every runs/<date>/vo_script.txt against its delivered
take's soundcheck seconds, refitted on each call, so each shipped film corrects the next. The
delivered takes were picked in band by best-of-N, which pulls the fit toward the band, which is
the question this tool answers anyway. On 2026-11-14 the fit is about 0.35 s/word + 0.98
s/sentence, leave-one-out MAE 6.3 s, bias -0.5 s. `--self-test` fails when the backtest drifts
(bias over 3 s, MAE over 10 s) or when the state.yaml words band, read at the archive's median
sentence density, would not land inside the seconds band.
"""
import json
import os
import re
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DEFAULT = os.path.join(REPO, "out", "dispatch", "vo_script.txt")
STATE = os.path.join(REPO, "config", "state.yaml")

RUNS = os.path.join(REPO, "runs")

# (words, sentences, measured_seconds, note). The 08-09 fallback, used only when the archive has
# fewer than MIN_ARCHIVE measured films (a fresh clone without runs/).
POINTS = [
    (281, 35, 146.5, "2026-08-09 take 0, first synth, over band"),
    (257, 24, 128.4, "2026-08-09 delivered take, in band"),
]
MIN_ARCHIVE = 8
MAX_BIAS_S = 3.0
MAX_MAE_S = 10.0


def counts(text: str):
    words = len(text.split())
    # a sentence ends at . ! or ? — the units the Pace paragraph tells the reader to breathe at
    sentences = len([s for s in re.split(r"[.!?]+", text) if s.strip()])
    return words, sentences


def archive_points(runs=RUNS):
    """[(words, sentences, seconds, date)] for every shipped film whose delivered take was measured."""
    out = []
    for d in sorted(os.listdir(runs)) if os.path.isdir(runs) else []:
        try:
            text = open(os.path.join(runs, d, "vo_script.txt")).read()
            rep = json.load(open(os.path.join(runs, d, "vo_report.json")))
        except (OSError, ValueError):
            continue
        sec = (rep.get("soundcheck") or {}).get("seconds") if isinstance(rep, dict) else None
        if isinstance(sec, (int, float)) and sec > 0:
            w, n = counts(text)
            if w and n:
                out.append((w, n, float(sec), d))
    return out


def solve(points):
    """Least squares, no intercept: seconds = a * words + b * sentences."""
    sww = sum(p[0] * p[0] for p in points)
    sws = sum(p[0] * p[1] for p in points)
    sss = sum(p[1] * p[1] for p in points)
    swy = sum(p[0] * p[2] for p in points)
    ssy = sum(p[1] * p[2] for p in points)
    det = sww * sss - sws * sws
    if not points or abs(det) < 1e-9:
        raise ValueError("degenerate fit")
    return (swy * sss - ssy * sws) / det, (sww * ssy - sws * swy) / det


def model(runs=RUNS):
    """(per_word, per_sentence, points, source)."""
    pts = archive_points(runs)
    if len(pts) >= MIN_ARCHIVE:
        return (*solve(pts), pts, f"{len(pts)} shipped films in runs/")
    a, b = solve(POINTS)
    return a, b, list(POINTS), f"{len(POINTS)} fallback synths (2026-08-09)"


def backtest(points):
    """Leave-one-out (MAE, mean signed error) in seconds."""
    errs = []
    for i, p in enumerate(points):
        a, b = solve(points[:i] + points[i + 1:])
        errs.append(a * p[0] + b * p[1] - p[2])
    return sum(abs(e) for e in errs) / len(errs), sum(errs) / len(errs)


def band():
    """Read the bands out of state.yaml rather than restating them (the 2026-08-06 lesson:
    a number restated in a second place will be wrong in one of them)."""
    lo, hi = 112.0, 130.0
    wlo, whi = 262, 282
    try:
        import yaml
        d = yaml.safe_load(open(STATE)) or {}
        sb = d.get("dispatch_seconds_band") or [lo, hi]
        wb = d.get("dispatch_vo_words_band") or [wlo, whi]
        lo, hi = float(sb[0]), float(sb[1])
        wlo, whi = int(wb[0]), int(wb[1])
    except Exception:
        pass
    return lo, hi, wlo, whi


def main() -> int:
    path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT
    if not os.path.exists(path):
        print(f"vo_length_estimate: no script at {path}")
        return 0
    text = open(path).read()
    w, s = counts(text)
    lo, hi, wlo, whi = band()
    PER_WORD, PER_SENTENCE, pts, source = model()
    est = PER_WORD * w + PER_SENTENCE * s

    print(f"vo_length_estimate: {w} words, {s} sentences  ({w / max(1, s):.1f} words per sentence)")
    print(f"  words band {wlo}-{whi}: {'inside' if wlo <= w <= whi else 'OUTSIDE'}")
    print(f"  predicted runtime {est:.1f}s   seconds band {lo:.0f}-{hi:.0f}: "
          f"{'inside' if lo <= est <= hi else 'OUTSIDE'}")
    print(f"  model: {PER_WORD:.4f} s/word + {PER_SENTENCE:.4f} s/sentence, fitted on "
          f"{source} (treat as a steer)")

    if est > hi:
        over = est - hi
        # a sentence costs about 1.6 words, so say which lever is cheaper for THIS script
        by_words = over / PER_WORD
        by_merge = over / PER_SENTENCE
        print(f"  OVER by {over:.1f}s. Either cut about {by_words:.0f} words, or merge about "
              f"{by_merge:.0f} sentence breaks into single clauses, or split the difference.")
        print("  MERGING IS USUALLY THE BETTER TRADE, because it costs no facts. Joining two "
              "short sentences with 'and', 'so' or 'because' also strengthens the causal chain "
              "Gate 0E grades, so it buys twice.")
    elif est < lo:
        print(f"  UNDER by {lo - est:.1f}s. There is room for a fact you were about to cut.")
    else:
        print("  Looks synthesisable as written. Synth it.")
    return 0


def self_test() -> int:
    bad = []
    a, b = solve([(100, 10, 50.0, ""), (200, 10, 90.0, ""), (150, 30, 90.0, "")])
    if abs(a * 100 + b * 10 - 50) > 1e-6 or abs(a * 150 + b * 30 - 90) > 1e-6:
        bad.append("solve does not reproduce an exact three-point system")
    per_word, per_sentence, pts, source = model()
    print(f"  fit: {per_word:.4f} s/word + {per_sentence:.4f} s/sentence on {source}")
    if len(pts) < MIN_ARCHIVE:
        print("  NOTE runs/ has too few measured films for a backtest; fallback fit only")
    else:
        mae, bias = backtest(pts)
        print(f"  leave-one-out: MAE {mae:.1f} s, bias {bias:+.1f} s")
        if abs(bias) > MAX_BIAS_S or mae > MAX_MAE_S:
            bad.append(f"backtest bias {bias:+.1f} s / MAE {mae:.1f} s outside {MAX_BIAS_S:g} / {MAX_MAE_S:g}")
        lo, hi, wlo, whi = band()
        dens = sorted(p[1] / p[0] for p in pts)[len(pts) // 2]
        at_lo, at_hi = (per_word + per_sentence * dens) * wlo, (per_word + per_sentence * dens) * whi
        print(f"  state.yaml words band {wlo}-{whi} at median density {dens:.3f} sentences/word -> "
              f"{at_lo:.1f} to {at_hi:.1f} s against {lo:g}-{hi:g}")
        if at_lo < lo or at_hi > hi:
            bad.append(f"words band {wlo}-{whi} predicts {at_lo:.1f}-{at_hi:.1f} s, outside the "
                       f"{lo:g}-{hi:g} s band: re-derive dispatch_vo_words_band from this fit")
    for line in bad:
        print("  FAIL " + line)
    print("vo_length_estimate self-test: " + ("FAIL" if bad else "PASS"))
    return 1 if bad else 0


if __name__ == "__main__":
    if "--self-test" in sys.argv[1:]:
        raise SystemExit(self_test())
    raise SystemExit(main())
