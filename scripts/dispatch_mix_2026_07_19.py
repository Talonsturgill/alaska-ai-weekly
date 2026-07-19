#!/usr/bin/env python3
"""Mix the Dispatch master audio for 2026-07-19 ("GVEA's Turbine Ticket"): VO
(dominant) + ducked music bed + SFX events, with a real pre-button silence dip,
normalized to -14 LUFS / TP <= -1.0 dBTP. Adapted from scripts/dispatch_mix.py's
proven filtergraph; this run's EVENTS/duration are its own (13 VO lines, 51.63s).
"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, ".."))
OUT = os.path.join(REPO, "out", "dispatch")
AUD = os.path.join(OUT, "audio")
FF = os.environ.get("FFMPEG_BIN", "ffmpeg")
SR = 44100
VIDEO_SECS = json.load(open(os.path.join(OUT, "episode_props.json")))["total"] / 30.0


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.stderr.write(r.stderr[-2000:])
        raise SystemExit(f"ffmpeg failed: {' '.join(cmd[:6])}...")
    return r


def sfx(path, kind):
    sys.path.insert(0, HERE)
    from sfx_bank import resolve as _resolve
    import shutil
    shutil.copyfile(_resolve(kind), path)


_lines = json.load(open(os.path.join(OUT, "vo_lines.json")))["lines"]
L = {x["idx"]: x["start"] for x in _lines}

# EVENTS keyed to this run's 14-beat storyboard, anchored on the ACTUAL VO line
# starts (not the storyboard's planning-time seconds, which assumed a longer
# runtime than the synthesized take): (time, sfx_bank kind).
EVENTS = [
    (L[0] + 0.10, "paper"),    # S1: ticket pinned
    (L[0] + 0.35, "chime"),    # S1: chest-glow chime
    (L[1] + 0.00, "whoosh"),   # S2 in: camera pulls back
    (L[2] + 0.00, "klaxon"),   # data centers cut into the queue
    (L[3] + 0.00, "tick"),     # backlog counter spins
    (L[4] + 0.10, "pop"),      # S3: Moose bumped
    (L[4] + 0.25, "thud"),     # bump impact
    (L[5] + 0.00, "riser"),    # Siemens Energy stat
    (L[6] + 0.00, "thud"),     # S4: Southcentral power sign slams shut (2024)
    (L[6] + 2.60, "snap"),     # Enstar gas sign snaps shut (2025)
    (L[7] + 0.00, "clank"),    # new turbine slots in
    (L[7] + 2.00, "riser"),    # battery bet rising synth
    (L[8] + 0.00, "riser"),    # S5 in: the turn, ominous
    (L[9] + 0.00, "tick"),     # quote types out
    (L[10] + 0.00, "tick"),    # S6: clock ticks toward the vote
    (L[11] + 0.00, "whoosh"),  # soft, quiet -- the undecided freeze
    (L[12] + 0.00, "chime"),   # final callback chime, ticket motif returns
]

# the real >=6dB dip lands just before the verbatim quote (beat 11 / the button
# of the turn), matching storyboard.audio_arc.dip_at
SILENCE_DIP_AT = L[9] - 0.6
DIP_LEN = 0.9


def main():
    os.makedirs(os.path.join(AUD, "sfx"), exist_ok=True)
    kinds = sorted(set(k for _, k in EVENTS))
    for k in kinds:
        sfx(os.path.join(AUD, "sfx", f"{k}.wav"), k)

    inputs = ["-i", os.path.join(AUD, "vo.wav"), "-i", os.path.join(OUT, "music_bed.wav")]
    for t, k in EVENTS:
        inputs += ["-i", os.path.join(AUD, "sfx", f"{k}.wav")]

    fc = []
    fc.append(f"[0:a]aformat=sample_rates={SR}:channel_layouts=stereo,apad=whole_dur={VIDEO_SECS},volume=1.0,asplit=2[vo][vok]")
    dip0, dip1 = SILENCE_DIP_AT, SILENCE_DIP_AT + DIP_LEN
    fc.append(
        f"[1:a]aformat=sample_rates={SR}:channel_layouts=stereo,aloop=loop=-1:size={int(SR*200)},"
        f"atrim=0:{VIDEO_SECS},volume=0.32,"
        f"volume=enable='between(t,{dip0},{dip1})':volume=0.16[bedraw]"
    )
    fc.append("[bedraw][vok]sidechaincompress=threshold=0.04:ratio=9:attack=6:release=320:makeup=1[bed]")
    sfx_labels = []
    for i, (t, k) in enumerate(EVENTS):
        idx = 2 + i
        ms = int(max(0, t) * 1000)
        lbl = f"s{i}"
        fc.append(f"[{idx}:a]aformat=sample_rates={SR}:channel_layouts=stereo,adelay={ms}|{ms},volume=0.5[{lbl}]")
        sfx_labels.append(f"[{lbl}]")
    mix_in = "[vo][bed]" + "".join(sfx_labels)
    n = 2 + len(sfx_labels)
    fc.append(f"{mix_in}amix=inputs={n}:normalize=0:dropout_transition=0[premix]")
    # loudnorm's single-pass TP target undershoots in practice (measured -0.45
    # dBTP against a -1.0 target on this run's mix); follow it with a real
    # brickwall true-peak limiter well under the ceiling for margin.
    fc.append("[premix]loudnorm=I=-14:TP=-2.0:LRA=11,alimiter=limit=0.83:attack=1:release=60:level=disabled[out]")

    filtergraph = ";".join(fc)
    master = os.path.join(AUD, "master.wav")
    run([FF, "-y", *inputs, "-filter_complex", filtergraph, "-map", "[out]",
         "-ar", str(SR), "-ac", "2", "-t", str(VIDEO_SECS), master])
    print("wrote", master)

    json.dump({"events": [{"t": t, "kind": k} for t, k in EVENTS],
               "silence_dip_at": SILENCE_DIP_AT, "count": len(EVENTS)},
              open(os.path.join(AUD, "sfx_events.json"), "w"), indent=2)


if __name__ == "__main__":
    main()
