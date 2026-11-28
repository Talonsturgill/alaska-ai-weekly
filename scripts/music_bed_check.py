#!/usr/bin/env python3
"""Fail a cut at the source gates when the music bed the mix will read is not there or not the credited one.

Machine pass 2026-11-28 (queue music-bed-not-built). The 11-28 full cut passed every source gate, spent
its render, and stopped at the mix on a missing out/dispatch/music_bed.wav: the track had been fetched
with --out pointing at music.mp3, so music_credit.json named that file and the bed the mix hard-codes
(dispatch_mix.py reads OUT/music_bed.wav) was never built. Rebuilding the bed then rewrote the credit
string, credits_check failed in preflight, and the deliverables went stale. Everything that went wrong
was knowable from two files before a frame was spent.

It checks, in out/dispatch (or --dir):
  1. music_bed.wav exists, is a RIFF/WAVE file, and decodes to at least MIN_S seconds (ffprobe when it
     is installed, the WAV header otherwise);
  2. music_credit.json exists, has a nonempty `credit`, and its `wav` names that same music_bed.wav;
  3. the credit's recorded `duration` is within 2 s of the bed's, so the credit was written for this bed.

    python3 scripts/music_bed_check.py               # exit 0 PASS, 1 FAIL
    python3 scripts/music_bed_check.py --self-test   # hermetic, temp files only
"""
import json
import os
import struct
import subprocess
import sys
import tempfile
import wave

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
OUT = os.path.join(REPO, "out", "dispatch")
BED = "music_bed.wav"
MIN_S = 20.0


def wav_seconds(path):
    try:
        r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                           capture_output=True, text=True, timeout=60)
        if r.returncode == 0 and r.stdout.strip():
            return float(r.stdout.strip())
    except (OSError, ValueError, subprocess.TimeoutExpired):
        pass
    try:
        with wave.open(path, "rb") as w:
            return w.getnframes() / float(w.getframerate())
    except (wave.Error, EOFError, OSError, ZeroDivisionError):
        return 0.0


def check(d):
    problems = []
    bed = os.path.join(d, BED)
    secs = 0.0
    if not os.path.isfile(bed):
        problems.append(f"{BED} is missing from {d}; dispatch_mix.py reads exactly that file. Rebuild it with "
                        f"get_music.py --out {os.path.relpath(bed, REPO)} (never another name).")
    else:
        with open(bed, "rb") as fh:
            head = fh.read(12)
        if len(head) < 12 or head[:4] != b"RIFF" or head[8:12] != b"WAVE":
            problems.append(f"{BED} is not a WAV file (an mp3 or an HTML page saved under the bed's name).")
        else:
            secs = wav_seconds(bed)
            if secs < MIN_S:
                problems.append(f"{BED} decodes to {secs:.1f} s, under {MIN_S:.0f} s.")
    cp = os.path.join(d, "music_credit.json")
    if not os.path.isfile(cp):
        problems.append("music_credit.json is missing, so the end card's music credit has no record.")
        return problems
    try:
        credit = json.load(open(cp))
    except (ValueError, OSError) as exc:
        problems.append(f"music_credit.json does not parse: {exc}")
        return problems
    if not str(credit.get("credit", "")).strip():
        problems.append("music_credit.json has no `credit` string.")
    wav = str(credit.get("wav", ""))
    if os.path.basename(wav) != BED:
        problems.append(f"music_credit.json's wav is {wav!r}, not {BED}: the credit was written for a different "
                        f"file than the bed the mix plays (11-28: it named music.mp3).")
    rec = credit.get("duration")
    if secs and isinstance(rec, (int, float)) and abs(float(rec) - secs) > 2.0:
        problems.append(f"music_credit.json records {rec} s but {BED} is {secs:.1f} s: the credit belongs to "
                        f"another build of the bed.")
    return problems


def _write_wav(path, seconds):
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(8000)
        w.writeframes(struct.pack("<h", 0) * int(8000 * seconds))


def _self_test():
    fails = []
    with tempfile.TemporaryDirectory(prefix="music-bed-") as d:
        ok = {"credit": "\"Aretes\" Kevin MacLeod (incompetech.com), licensed under CC BY 4.0",
              "wav": "out/dispatch/music_bed.wav", "duration": 30.0}
        # the 11-28 shape: fetched to music.mp3, no bed, credit names the mp3
        open(os.path.join(d, "music.mp3"), "wb").write(b"ID3" + b"\0" * 200)
        json.dump({**ok, "wav": "out/dispatch/music.mp3"}, open(os.path.join(d, "music_credit.json"), "w"))
        p = check(d)
        if not any("missing" in x for x in p) or not any("music.mp3" in x for x in p):
            fails.append(f"11-28 shape not caught: {p}")
        # a bed under the right name that is really an mp3
        open(os.path.join(d, BED), "wb").write(b"ID3" + b"\0" * 200)
        json.dump(ok, open(os.path.join(d, "music_credit.json"), "w"))
        if not any("not a WAV" in x for x in check(d)):
            fails.append("an mp3 under the bed's name passed")
        # the good shape
        _write_wav(os.path.join(d, BED), 30.0)
        if check(d):
            fails.append(f"a good bed and credit failed: {check(d)}")
        # a credit from another build of the bed
        json.dump({**ok, "duration": 180.0}, open(os.path.join(d, "music_credit.json"), "w"))
        if not any("another build" in x for x in check(d)):
            fails.append("a stale credit duration passed")
        # a too-short bed
        _write_wav(os.path.join(d, BED), 5.0)
        json.dump({**ok, "duration": 5.0}, open(os.path.join(d, "music_credit.json"), "w"))
        if not any("under" in x for x in check(d)):
            fails.append("a 5 s bed passed")
        # get_music keeps the recorded credit when the same track's bed is rebuilt, and refuses a non-WAV out
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        import get_music
        cp = os.path.join(d, "music_credit.json")
        json.dump({**ok, "url": "https://example.org/a.mp3"}, open(cp, "w"))
        if get_music.kept_credit(cp, "https://example.org/a.mp3") != ok["credit"]:
            fails.append("get_music did not keep the recorded credit for the same track")
        if get_music.kept_credit(cp, "https://example.org/b.mp3"):
            fails.append("get_music kept a credit for a different track")
        r = subprocess.run([sys.executable, get_music.__file__, "--url", "https://example.org/a.mp3",
                            "--out", os.path.join(d, "music.mp3")], capture_output=True, text=True, timeout=60)
        if r.returncode != 2:
            fails.append(f"get_music accepted --out music.mp3 (exit {r.returncode})")
    if fails:
        print("music_bed_check self-test: FAIL\n  " + "\n  ".join(fails))
        return 1
    print("music_bed_check self-test: PASS (the 11-28 music.mp3 shape, an mp3 under the bed's name, a stale "
          "credit and a short bed are caught; a good bed passes; get_music keeps a same-track credit and "
          "refuses a non-WAV --out)")
    return 0


def main(argv):
    if argv[:1] == ["--self-test"]:
        return _self_test()
    d = OUT
    if argv[:1] == ["--dir"] and len(argv) > 1:
        d = os.path.abspath(argv[1])
    problems = check(d)
    if problems:
        print("FAIL [music_bed]\n  " + "\n  ".join(problems))
        return 1
    print(f"PASS [music_bed] {BED} is a WAV of {wav_seconds(os.path.join(d, BED)):.1f} s and music_credit.json "
          f"credits it")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
