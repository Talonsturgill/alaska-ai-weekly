#!/usr/bin/env python3
"""Generate out/evidence/audio_report.json from MEASUREMENTS, never from memory.

WHY THIS EXISTS (2026-08-04). This file used to be hand-written into the evidence pack.
It carried the sentence "the VO runs nearly wall to wall across 83.8s with one gap over
0.35s, so there is almost nowhere for the bed to open", and it was false. Two judges
checked it against the run's own word timings in the same round and found 21 gaps longer
than 0.35s, 13 longer than 0.50s, and roughly 11.9 seconds of silence inside an 81.6s VO
track. The orchestrator had repeated the claim to the owner as fact.

That is worse than a wrong number in a report. The evidence pack is what the panel grades
from, so a hand-written assertion inside it is an unverified claim wearing the costume of
a measurement, and it pointed the fix at cutting VO when the actual cause was a music bed
that never rises into the gaps that already exist.

So nothing in this file is typed by hand. Every number comes from words.json and ffmpeg,
and the diagnosis is derived from those numbers rather than asserted alongside them.
"""
import argparse
import json
import os
import re
import subprocess

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(REPO, "out", "dispatch")
EV = os.path.join(REPO, "out", "evidence")


def loudnorm(path):
    p = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", path,
         "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
        capture_output=True, text=True)
    m = re.search(r"\{[^{}]*input_i[^{}]*\}", p.stderr, re.S)
    if not m:
        return {}
    d = json.loads(m.group(0))
    return {"i": float(d["input_i"]), "tp": float(d["input_tp"]),
            "lra": float(d["input_lra"])}


def gaps_from_words(words_path, min_gap=0.35):
    w = json.load(open(words_path))["words"]
    out = []
    for a, b in zip(w, w[1:]):
        g = b["s"] - a["e"]
        if g >= min_gap:
            out.append({"at": round(a["e"], 2), "len": round(g, 2)})
    return out, (w[-1]["e"] if w else 0.0)


def short_term(path):
    """[(t, S)] short-term (3 s) loudness every 0.1 s, from ffmpeg's ebur128 meter."""
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128",
                        "-f", "null", "-"], capture_output=True, text=True)
    return [(float(t), float(v)) for t, v in
            re.findall(r"\bt:\s*([\d.]+)\s.*?\bS:\s*(-?[\d.]+)", p.stderr)]


def decode_mono(path, sr=16000):
    """The delivered mix as mono float32 samples at `sr`, or None when ffmpeg can't read it."""
    import numpy as np
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-loglevel", "error", "-i", path,
                        "-vn", "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"], capture_output=True)
    if p.returncode or not p.stdout:
        return None
    return np.frombuffer(p.stdout, dtype=np.float32)


DEAD_AIR_DBFS = -55.0    # under this the gap is digital quiet: no bed is playing
EDGE_S = 0.08            # trimmed off each side of a gap so word tails and onsets stay out


def gap_beds(samples, sr, gaps, words, min_len=0.50):
    """What a listener hears in each VO gap, MEASURED (machine pass 2026-11-06; queue: ambience
    audibility, repeat 2). Judges read the pack, not the speakers, and on 10-31 and 11-06 they wrote
    "thin ambience" and "no audible ambience evidence" beside a mix that played a room tone bed for
    the whole film, because nothing in the pack said how loud the air in the gaps was. This gives
    each gap of `min_len` or more its RMS level in the delivered mix and its distance under the
    voice, and names any gap that falls to digital quiet, which is dead air and a real defect."""
    import numpy as np

    def rms_db(a, b):
        seg = samples[max(0, int(a * sr)):max(0, int(b * sr))]
        if len(seg) < sr * 0.05:
            return None
        r = float(np.sqrt(np.mean(np.square(seg, dtype=np.float64))))
        return round(20 * np.log10(max(r, 1e-9)), 1)

    voiced = [rms_db(w["s"], w["e"]) for w in words if w["e"] - w["s"] >= 0.12]
    voiced = sorted(v for v in voiced if v is not None)
    voice_db = voiced[len(voiced) // 2] if voiced else None
    rows = []
    for g in gaps:
        if g["len"] < min_len:
            continue
        db = rms_db(g["at"] + EDGE_S, g["at"] + g["len"] - EDGE_S)
        if db is None:
            continue
        rows.append({"at": g["at"], "len": g["len"], "gap_dbfs": db,
                     "under_voice_db": round(voice_db - db, 1) if voice_db is not None else None})
    levels = sorted(r["gap_dbfs"] for r in rows)
    dead = [r for r in rows if r["gap_dbfs"] < DEAD_AIR_DBFS]
    summary = {
        "voice_median_dbfs": voice_db,
        "gaps_measured": len(rows),
        "gap_median_dbfs": levels[len(levels) // 2] if levels else None,
        "gap_quietest_dbfs": levels[0] if levels else None,
        "dead_air_gaps": len(dead),
        "dead_air_floor_dbfs": DEAD_AIR_DBFS,
    }
    if not rows:
        note = "no VO gap of 0.5 s or more to measure"
    elif dead:
        note = (f"{len(dead)} of {len(rows)} gaps fall under {DEAD_AIR_DBFS:g} dBFS, digital quiet with "
                f"no bed playing, at " + ", ".join(f"{r['at']}s" for r in dead[:6])
                + ": bring the ambience bed up through those gaps")
    else:
        note = (f"every one of the {len(rows)} gaps of 0.5 s or more carries sound: what plays in them (music, effects, ambience) measures "
                f"{summary['gap_median_dbfs']} dBFS median (quietest {summary['gap_quietest_dbfs']}) "
                f"against the voice's {voice_db}, so no gap is dead air")
    summary["note"] = note
    return rows, summary


MASKED_DB = 15.0         # an ambience this far under the gap level is masked by what else plays


def ambience_alone_dbfs():
    """RMS of the board's ambience layers rendered ALONE by dispatch_mix --ambience-preview (the
    same chains the mix plays), measured 2 to 9 s in like its own self-test. None when unavailable."""
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        path = os.path.join(td, "amb.wav")
        p = subprocess.run(["python3", os.path.join(REPO, "scripts", "dispatch_mix.py"),
                            "--ambience-preview", path], capture_output=True, text=True, cwd=REPO)
        if p.returncode or not os.path.exists(path):
            return None
        r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-ss", "2", "-t", "7", "-i", path, "-af",
                            "astats=measure_overall=RMS_level:measure_perchannel=0", "-f", "null", "-"],
                           capture_output=True, text=True).stderr
        lv = [ln for ln in r.splitlines() if "RMS level" in ln]
        try:
            return round(float(lv[-1].split(":")[-1]), 1)
        except (IndexError, ValueError):
            return None


def masking_note(summary, amb_db):
    """Say whether the ambience a judge is told about can be heard in the gaps, measured."""
    gap = summary.get("gap_median_dbfs")
    if amb_db is None or gap is None:
        return None
    margin = round(gap - amb_db, 1)
    if margin >= MASKED_DB:
        return (margin, f"the ambience layers alone measure {amb_db} dBFS RMS, {margin} dB under the "
                        f"{gap} dBFS median of what plays in the gaps (music and effects), so they are "
                        f"masked there and a listener hears the music, not the room: to let the room be "
                        f"heard, dip the music in a few long gaps rather than raising the bed")
    return (margin, f"the ambience layers alone measure {amb_db} dBFS RMS, {margin} dB under the gap "
                    f"median of {gap} dBFS, close enough to be heard in the gaps")


def _extremes(windows, key, n=3, apart=3.0):
    out = []
    for t, v in sorted(windows, key=key):
        if all(abs(t - u) >= apart for u, _ in out):
            out.append((t, v))
        if len(out) == n:
            break
    return out


def diagnose(lra, gaps, last_word, windows=None):
    """(diagnosis, lra_windows) for all three cases: under, inside and OVER the 6 to 9 LU target.

    The over branch was missing until the machine pass of 2026-10-21. On 10-11 (LRA 11.4) and
    10-17 (9.1 to 9.3) this printed the under-target cause, or "inside the target" beside
    pass.lra false, and all three 10-17 judges named the LRA. An LRA over target means the quiet
    3 s windows sit too far under the loud ones, so it names both, measured, and says which quiet
    windows hold a VO gap where only the bed is playing.
    """
    long_gaps = [g for g in gaps if g["len"] >= 0.50]
    silence = round(sum(g["len"] for g in gaps), 2)
    if 6.0 <= lra <= 9.0:
        return "LRA is inside the 6 to 9 LU target.", None
    if lra < 6.0:
        return (
            f"LRA is {lra} against the 6 to 9 LU target. MEASURED CAUSE, not asserted: the "
            f"VO track leaves {len(gaps)} gaps of 0.35s or longer ({len(long_gaps)} of them "
            f"0.50s or longer), totalling {silence}s of silence, and the last word ends at "
            f"{round(last_word, 2)}s. The room for the bed to open therefore EXISTS. If the "
            f"loudness range is still flat, the bed is not rising into that room, which is a "
            f"mix problem to be fixed at the faders and the duck release, not a script "
            f"problem to be fixed by cutting lines. An earlier hand-written version of this "
            f"field claimed there was only one gap over 0.35s and sent the fix in the wrong "
            f"direction; these figures are computed from words.json every run."), None
    # Over target. Measure inside the narration only: the credits tail and the silent head are
    # not what the range gate is complaining about, and ebur128 gates out silence anyway.
    span = [(t, v) for t, v in (windows or []) if 3.0 <= t <= last_word + 0.5 and v > -70.0]
    if not span:
        return (f"LRA is {lra}, OVER the 9 LU ceiling, and the short-term loudness timeline "
                f"could not be measured to say where; rerun with ffmpeg's ebur128 available."), None

    def silent_s(t):
        """seconds of the 3 s window ending at t in which the voice is silent"""
        return round(sum(max(0.0, min(t, g["at"] + g["len"]) - max(t - 3.0, g["at"])) for g in gaps), 2)

    # Only windows that stand OUT of the narration's own level are a cause: 3 LU under or over
    # its median short-term loudness. Plain speech at the median is never named.
    med = sorted(v for _, v in span)[len(span) // 2]
    quiet = _extremes([w for w in span if w[1] <= med - 3.0], key=lambda w: w[1])
    loud = _extremes([w for w in span if w[1] >= med + 3.0], key=lambda w: -w[1])
    q_rows = [{"t": round(t, 1), "short_term_lufs": round(v, 1),
               "vo_silent_s_of_3": silent_s(t)} for t, v in quiet]
    l_rows = [{"t": round(t, 1), "short_term_lufs": round(v, 1)} for t, v in loud]
    gapped = sum(1 for r in q_rows if r["vo_silent_s_of_3"] >= 1.0)
    q_txt = ", ".join(f"{r['t']}s ({r['short_term_lufs']} LUFS, voice silent "
                      f"{r['vo_silent_s_of_3']}s of the 3)" for r in q_rows) or "none"
    l_txt = ", ".join(f"{r['t']}s ({r['short_term_lufs']} LUFS)" for r in l_rows) or "none"
    if q_rows and gapped * 2 >= len(q_rows):
        cause = ("most of the quiet windows are VO gaps where only the bed plays, so lift the bed "
                 "into those gaps (the gap lift in dispatch_mix.py) rather than cutting lines")
    elif q_rows:
        cause = ("the quiet windows are under the voice itself, so the VO arc dips too deep there: "
                 "soften the arc depth in dispatch_mix.py at those times before touching the script")
    else:
        cause = ("nothing sits far under the narration, so the loud end is the outlier: pull down "
                 "the loudest windows (a hero hit, a riser or the gap lift peak)")
    return (f"LRA is {lra}, OVER the 6 to 9 LU target. MEASURED CAUSE, not asserted: the "
            f"narration's median short-term loudness is {round(med, 1)} LUFS; windows 3 LU or more "
            f"under it: {q_txt}; windows 3 LU or more over it: {l_txt}. {gapped} of the "
            f"{len(q_rows)} quiet windows are at least a third VO silence, so {cause}."), \
        {"median_short_term_lufs": round(med, 1), "quietest": q_rows, "loudest": l_rows}


def _self_test():
    gaps = [{"at": 20.0, "len": 1.6}, {"at": 40.0, "len": 0.4}]
    ok_in = diagnose(7.4, gaps, 60.0)[0].startswith("LRA is inside")
    ok_lo = "gaps of 0.35s" in diagnose(4.0, gaps, 60.0)[0]
    win = [(t / 10, -14.0) for t in range(30, 600)]
    win = [(t, -31.0 if 21.0 <= t <= 22.5 else -9.0 if 45.0 <= t <= 45.4 else v) for t, v in win]
    d, rows = diagnose(11.4, gaps, 60.0, win)
    ok_hi = (d.startswith("LRA is 11.4, OVER") and rows["quietest"][0]["vo_silent_s_of_3"] >= 1.0 and "lift the bed" in d
             and rows["loudest"][0]["t"] == 45.0 and "inside the target" not in d)
    flat = [(t / 10, -14.0) for t in range(30, 600)]
    flat = [(t, -13.0 if 30.0 <= t <= 33.0 else -24.0 if 50.0 <= t <= 51.0 else v) for t, v in flat]
    d2, rows2 = diagnose(9.4, [], 60.0, flat)
    ok_arc = "under the voice itself" in d2 and [r["t"] for r in rows2["quietest"]] == [50.0] \
        and rows2["loudest"] == []
    ok_none = "could not be measured" in diagnose(9.3, gaps, 60.0, [])[0]
    checks = [(ok_in, "inside 6 to 9 says inside"), (ok_lo, "under 6 keeps the gap count cause"),
              (ok_hi, "over 9 names the quiet window in a VO gap and the loud peak, and blames the bed"),
              (ok_arc, "a dip under continuous voice blames the VO arc, and median speech is never named"),
              (ok_none, "over 9 with no meter says so instead of claiming inside")]
    # gap beds: a voice with a -40 dBFS bed in one gap and digital quiet in the other
    import numpy as np
    sr = 16000
    rng = np.random.default_rng(11)
    sig = (rng.standard_normal(sr * 6) * 0.01).astype(np.float32)          # about -40 dBFS air
    sig[: sr * 1] = np.sin(np.arange(sr) * 0.2) * 0.3                      # a word, 0 to 1 s
    sig[int(sr * 3.0): int(sr * 4.0)] = 0.0                                # dead air, 3 to 4 s
    sig[int(sr * 4.0): int(sr * 5.0)] = np.sin(np.arange(sr) * 0.2) * 0.3  # a word, 4 to 5 s
    words = [{"s": 0.0, "e": 1.0}, {"s": 4.0, "e": 5.0}]
    rows, summ = gap_beds(sig, sr, [{"at": 1.0, "len": 1.8}, {"at": 3.0, "len": 1.0}], words)
    ok_bed = (len(rows) == 2 and -43.0 < rows[0]["gap_dbfs"] < -37.0 and rows[0]["under_voice_db"] > 25
              and summ["dead_air_gaps"] == 1 and "3.0s" in summ["note"])
    checks.append((ok_bed, "gap beds measure the air in a gap, its distance under the voice, and name dead air"))
    m_hi = masking_note({"gap_median_dbfs": -16.0}, -41.5)
    m_lo = masking_note({"gap_median_dbfs": -36.0}, -41.5)
    ok_mask = (m_hi[0] == 25.5 and "masked" in m_hi[1] and "masked" not in m_lo[1]
               and masking_note({"gap_median_dbfs": -16.0}, None) is None)
    checks.append((ok_mask, "an ambience 15 dB or more under the gap level is called masked, a close one is not"))
    for ok, what in checks:
        print(f"  [{'x' if ok else ' '}] {what}")
    ok = all(c for c, _ in checks)
    print("SELF-TEST", "PASS" if ok else "FAIL")
    return 0 if ok else 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--delivered", default=os.path.join(OUT, "dispatch_square.mp4"))
    ap.add_argument("--words", default=os.path.join(OUT, "audio", "words.json"))
    ap.add_argument("--out", default=os.path.join(EV, "audio_report.json"))
    a = ap.parse_args()

    m = loudnorm(a.delivered)
    gaps, last_word = gaps_from_words(a.words)
    long_gaps = [g for g in gaps if g["len"] >= 0.50]
    silence = round(sum(g["len"] for g in gaps), 2)

    lra = m.get("lra", 0.0)
    windows = short_term(a.delivered) if lra > 9.0 else None
    diagnosis, lra_windows = diagnose(lra, gaps, last_word, windows)

    # PROVE THE MEASUREMENT COVERS THE MASTER, DO NOT ASSERT IT (2026-08-08).
    # The square is a video-only crop of the 9:16 master, so the two carry byte-identical
    # audio and a loudness figure from either is a figure for both. A judge grading the
    # master read "measured_on: dispatch_square.mp4" and correctly refused to credit a
    # passing mix on a file they were not grading. That is the pack's fault, not theirs:
    # the claim was true and the pack gave them no way to check it. So check it — decode
    # each audio stream and compare hashes. Costs a second and turns an assertion into
    # evidence a judge can act on.
    # The first build of this hashed the decoded PCM of each file and declared them
    # different. They ARE different, and it means nothing: both are lossy AAC encodes, so
    # identical input samples decode to non-identical output. A checker that fires on a
    # healthy pipeline gets waved through and then gets disabled, so it is measured
    # instead of hashed. The question a judge actually has is "do the numbers I am being
    # shown describe the file I am grading", and the way to answer it is to measure that
    # file too.
    master = os.path.join(OUT, "dispatch_master.mp4")
    if os.path.exists(master) and os.path.abspath(master) != os.path.abspath(a.delivered):
        mm = loudnorm(master)
        d_i = abs((mm.get("i") or 0) - (m.get("i") or 0))
        d_lra = abs((mm.get("lra") or 0) - lra)
        same = d_i <= 0.5 and d_lra <= 0.5
        same_note = (
            f"the 9:16 master measures I={mm.get('i')} TP={mm.get('tp')} LRA={mm.get('lra')} "
            f"against the delivered square's I={m.get('i')} TP={m.get('tp')} LRA={lra}. "
            + ("The square is a video-only crop of the master, so the two carry the same mix "
               "and every figure below describes both."
               if same else
               "THESE DO NOT AGREE. The square is supposed to be a video-only crop, so a "
               "loudness gap means one of them was built from a different mix. Do not grade "
               "either until that is explained."))
        master_metrics = {"i": mm.get("i"), "tp": mm.get("tp"), "lra": mm.get("lra")}
    else:
        same, master_metrics = None, None
        same_note = "dispatch_master.mp4 not present, cross measurement not performed"

    rep = {
        "measured_on": os.path.basename(a.delivered),
        "also_covers_master": same,
        "master_measured": master_metrics,
        "master_identity": same_note,
        "tool": "ffmpeg loudnorm + forced-alignment word timings",
        "delivered_i": m.get("i"),
        "delivered_tp": m.get("tp"),
        "delivered_lra": lra,
        "targets": {"i": -14.0, "tp_max": -1.0, "lra": [6.0, 9.0]},
        "pass": {
            "loudness": abs(m.get("i", 0) + 14.0) <= 1.0,
            "true_peak": m.get("tp", 0) <= -1.0,
            "lra": 6.0 <= lra <= 9.0,
        },
        "vo_gaps_ge_0_35s": len(gaps),
        "vo_gaps_ge_0_50s": len(long_gaps),
        "vo_silence_in_gaps_s": silence,
        "last_word_ends_s": round(last_word, 2),
        "longest_gaps": sorted(gaps, key=lambda g: -g["len"])[:8],
        "diagnosis": diagnosis,
    }
    if lra_windows:
        rep["lra_windows"] = lra_windows
    # THE HIT LIST RIDES IN THE PACK (2026-10-02). A judge marked Sound down with "nothing confirms
    # motivated SFX on the named hits": the pack carried loudness and VO gaps but never the list of
    # hits the mix actually performed, which dispatch_mix.py writes at mix time. One row per hit:
    # when, what kind, which loudness class, and the beat it answers.
    try:
        sfx = json.load(open(os.path.join(OUT, "sfx_events.json")))
        rep["sfx_hits"] = [{"t": round(e.get("rendered_start_s", e.get("t", 0)), 2), "kind": e.get("kind"),
                            "class": e.get("class"), "beat": (e.get("label") or "").split(" | ")[0][:90]}
                           for e in sfx.get("events", [])]
        rep["sfx_note"] = ("The mix's performed schedule, from out/dispatch/sfx_events.json: class gain tiers "
                           "hero about -11 dBFS, standard about -15, texture about -19, ducked under the VO.")
    except (OSError, ValueError):
        rep["sfx_hits"] = []
        sfx = {}
    # THE AIR IN THE GAPS RIDES IN THE PACK TOO (machine pass 2026-11-06). Measured on the delivered
    # file, beside the layers the mix says it played, so a judge reading "thin ambience" can check it.
    samples = decode_mono(a.delivered)
    if samples is not None:
        words = json.load(open(a.words))["words"]
        rows, summ = gap_beds(samples, 16000, gaps, words)
        summ["layers_played"] = (sfx.get("ambience") or {}).get("layers", [])
        mk = masking_note(summ, ambience_alone_dbfs())
        if mk:
            summ["ambience_alone_dbfs"] = round(summ["gap_median_dbfs"] - mk[0], 1)
            summ["ambience_under_gap_db"] = mk[0]
            summ["ambience_note"] = mk[1]
        rep["gap_beds_summary"] = summ
        rep["gap_beds"] = rows
    os.makedirs(EV, exist_ok=True)
    json.dump(rep, open(a.out, "w"), indent=1)
    print(f"audio_report: I={rep['delivered_i']} TP={rep['delivered_tp']} LRA={lra}")
    print(f"  {len(gaps)} gaps >=0.35s, {len(long_gaps)} >=0.50s, {silence}s of silence")
    if rep.get("gap_beds_summary"):
        print(f"  gap beds: {rep['gap_beds_summary']['note']}")
        if rep["gap_beds_summary"].get("ambience_note"):
            print(f"  ambience: {rep['gap_beds_summary']['ambience_note']}")
    print(f"  -> {a.out}")


if __name__ == "__main__":
    import sys
    if "--self-test" in sys.argv:
        sys.exit(_self_test())
    main()
