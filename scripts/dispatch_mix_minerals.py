#!/usr/bin/env python3
"""Mix the 2026-07-17 Dispatch master audio for "It's Digging For Its Own Parts".
Per-run mixer (repo pattern; the generic dispatch_mix.py is wired to a prior story's beats).
VO (dominant) + ducked music bed (The Descent) + SFX one-shots cut to THIS run's beats, with a
real pre-button silence dip, normalized to -14 LUFS / TP <= -1.0 dBTP. SFX synthesized in-process
via ffmpeg lavfi (no external assets). Reads out/dispatch/storyboard.json beats[] for event times
and audio/timing60.json for speech_end. Writes audio/master.wav + audio/sfx_events.json.
"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, ".."))
OUT = os.path.join(REPO, "out", "dispatch")
AUD = os.path.join(OUT, "audio")
FF = os.environ.get("FFMPEG_BIN", "ffmpeg")
SR = 44100

tim = json.load(open(os.path.join(AUD, "timing60.json")))
sb = json.load(open(os.path.join(OUT, "storyboard.json")))
SPEECH_END = float(tim.get("speech_end", 57.0))
VIDEO_SECS = round(59.0, 3)  # Root durationInFrames 1770 / 30fps
# The real pre-button breath is the VO gap between line 8 (ends ~51.1s) and the
# button line "Alaska found the flashlight" (52.0s), NOT the storyboard's nominal
# silence_at. Placing the dip in an actual gap makes it a >=6dB drop in the master.
SILENCE_DIP_AT = 51.15
DIP_LEN = 0.8


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.stderr.write(r.stderr[-2500:])
        raise SystemExit(f"ffmpeg failed: {' '.join(cmd[:6])}...")
    return r


# map this run's descriptive beat sfx -> a synth kind
def kind_of(name):
    n = (name or "").lower()
    if "whir" in n or "whoosh" in n or "reveal" in n or "hiss" in n or "swell" in n:
        return "whoosh"
    if "ding" in n or "badge" in n or "tile" in n or "cascade" in n:
        return "ding"
    if "stamp" in n or "thud" in n or "seal" in n or "deflate" in n:
        return "stamp"
    if "tick" in n or "radar" in n or "sweep" in n or "label" in n:
        return "tick"
    if "crack" in n or "pop" in n or "sparkle" in n or "glint" in n or "shimmer" in n:
        return "sparkle"
    if "doink" in n or "bounce" in n or "clank" in n or "claw" in n or "creak" in n or "strain" in n:
        return "thud"
    if "click" in n or "lock" in n or "growl" in n:
        return "lock"
    return "pop"


def sfx(path, kind):
    if kind == "whoosh":
        f = "anoisesrc=d=0.5:c=pink:a=0.5,highpass=f=280,lowpass=f=3600,afade=t=in:d=0.05,afade=t=out:d=0.42,volume=0.7"
    elif kind == "thud":
        f = "sine=frequency=92:duration=0.26,afade=t=out:d=0.24,volume=1.2"
    elif kind == "pop":
        f = "sine=frequency=520:duration=0.10,afade=t=out:d=0.09,volume=0.7"
    elif kind == "ding":
        f = "sine=frequency=1050:duration=0.28,afade=t=out:d=0.26,volume=0.6"
    elif kind == "stamp":
        f = "sine=frequency=70:duration=0.30,afade=t=out:d=0.28,volume=1.3"
    elif kind == "tick":
        f = "sine=frequency=1600:duration=0.05,volume=0.5"
    elif kind == "sparkle":
        f = "sine=frequency=1900:duration=0.16,afade=t=out:d=0.15,volume=0.5"
    elif kind == "lock":
        f = "sine=frequency=240:duration=0.09,afade=t=out:d=0.08,volume=0.9"
    else:
        f = "sine=frequency=440:duration=0.2,volume=0.5"
    run([FF, "-y", "-f", "lavfi", "-i", f, "-ac", "2", "-ar", str(SR), path])


def beat_start(t):
    s = str(t).split("-")[0]
    return float(s)


EVENTS = []
for b in sb["beats"]:
    t = beat_start(b["t"])
    if t >= VIDEO_SECS:
        continue
    EVENTS.append((round(t + 0.05, 2), kind_of(b.get("sfx", ""))))
# a couple of extra accents for texture (still >=1/shot, >=8 total guaranteed)
EVENTS.append((round(SPEECH_END + 0.35, 2), "lock"))  # final drill downbeat / cut to black


def main():
    os.makedirs(os.path.join(AUD, "sfx"), exist_ok=True)
    kinds = sorted(set(k for _, k in EVENTS))
    for k in kinds:
        sfx(os.path.join(AUD, "sfx", f"{k}.wav"), k)

    inputs = ["-i", os.path.join(AUD, "vo60.wav"), "-i", os.path.join(OUT, "music_bed.wav")]
    for t, k in EVENTS:
        inputs += ["-i", os.path.join(AUD, "sfx", f"{k}.wav")]

    fc = []
    fc.append(f"[0:a]aformat=sample_rates={SR}:channel_layouts=stereo,apad=whole_dur={VIDEO_SECS},volume=1.0,asplit=2[vo][vok]")
    dip0, dip1 = SILENCE_DIP_AT, SILENCE_DIP_AT + DIP_LEN
    fc.append(
        f"[1:a]aformat=sample_rates={SR}:channel_layouts=stereo,aloop=loop=-1:size={int(SR*200)},"
        f"atrim=0:{VIDEO_SECS},volume=0.30,"
        f"volume=enable='between(t,{dip0},{dip1})':volume=0.02[bedraw]"
    )
    fc.append(f"[bedraw][vok]sidechaincompress=threshold=0.04:ratio=9:attack=6:release=320:makeup=1[bed]")
    sfx_labels = []
    for i, (t, k) in enumerate(EVENTS):
        idx = 2 + i
        ms = int(t * 1000)
        lbl = f"s{i}"
        fc.append(f"[{idx}:a]aformat=sample_rates={SR}:channel_layouts=stereo,adelay={ms}|{ms},volume=0.5[{lbl}]")
        sfx_labels.append(f"[{lbl}]")
    mix_in = "[vo][bed]" + "".join(sfx_labels)
    n = 2 + len(sfx_labels)
    fc.append(f"{mix_in}amix=inputs={n}:normalize=0:dropout_transition=0[premix]")
    fc.append(f"[premix]loudnorm=I=-14:TP=-1.0:LRA=11,alimiter=limit=0.94[out]")

    filtergraph = ";".join(fc)
    master = os.path.join(AUD, "master.wav")
    run([FF, "-y", *inputs, "-filter_complex", filtergraph, "-map", "[out]",
         "-ar", str(SR), "-ac", "2", "-t", str(VIDEO_SECS), master])
    print("wrote", master, "events", len(EVENTS))
    json.dump({"events": [{"t": t, "kind": k} for t, k in EVENTS],
               "silence_dip_at": SILENCE_DIP_AT, "count": len(EVENTS)},
              open(os.path.join(AUD, "sfx_events.json"), "w"), indent=2)


if __name__ == "__main__":
    main()
