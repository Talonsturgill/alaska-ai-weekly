#!/usr/bin/env python3
"""Mix the Dispatch master audio: VO (dominant) + ducked music bed + SFX events,
with a real pre-button silence dip, normalized to -14 LUFS / TP <= -1.0 dBTP.

SFX are synthesized in-process (short WAVs via ffmpeg lavfi) so no external assets
are needed, then placed at scene beats. Music ducks under VO via sidechaincompress.
"""
import json, os, subprocess, sys, math

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, ".."))
OUT = os.path.join(REPO, "out", "dispatch")
AUD = os.path.join(OUT, "audio")
FF = os.environ.get("FFMPEG_BIN", "/usr/local/bin/ffmpeg")
SR = 44100
VIDEO_SECS = 55.0


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.stderr.write(r.stderr[-2000:])
        raise SystemExit(f"ffmpeg failed: {' '.join(cmd[:6])}...")
    return r


def sfx(path, kind):
    """Make a short one-shot SFX WAV."""
    if kind == "whoosh":
        f = "anoisesrc=d=0.5:c=pink:a=0.5,highpass=f=300,lowpass=f=3500,afade=t=in:d=0.05,afade=t=out:d=0.42,volume=0.7"
    elif kind == "thud":
        f = "sine=frequency=90:duration=0.28,afade=t=out:d=0.26,volume=1.2"
    elif kind == "pop":
        f = "sine=frequency=520:duration=0.12,afade=t=out:d=0.11,volume=0.7"
    elif kind == "ding":
        f = "sine=frequency=1200:duration=0.35,afade=t=out:d=0.33,volume=0.5"
    elif kind == "riser":
        f = "sine=frequency=220:duration=0.9,afade=t=in:d=0.85,volume=0.6"
    elif kind == "klaxon":
        f = "sine=frequency=330:duration=0.5,afade=t=out:d=0.45,volume=0.7"
    elif kind == "paper":
        f = "anoisesrc=d=0.7:c=white:a=0.4,highpass=f=1200,afade=t=out:d=0.6,volume=0.5"
    elif kind == "stamp":
        f = "sine=frequency=70:duration=0.3,afade=t=out:d=0.28,volume=1.3"
    elif kind == "tick":
        f = "sine=frequency=1500:duration=0.05,volume=0.5"
    else:
        f = "sine=frequency=440:duration=0.2,volume=0.5"
    run([FF, "-y", "-f", "lavfi", "-i", f, "-ac", "2", "-ar", str(SR), path])


# SFX events: (time_s, kind) — >=1 per scene, cut to the picture (VISUAL_FLOW).
EVENTS = [
    (0.10, "whoosh"),    # S1 machine appears
    (5.00, "pop"),       # square mile stamp
    (7.00, "riser"),     # plug reaches / gigawatt
    (10.31, "whoosh"),   # S2 scene in
    (13.6, "ding"),      # +30% badge
    (17.16, "whoosh"),   # S3 in
    (19.7, "pop"),       # $500M
    (21.3, "thud"),      # $10B leaps
    (24.63, "klaxon"),   # S4 revolt
    (26.0, "paper"),     # paper storm
    (27.2, "ding"),      # 500+ badge
    (30.35, "whoosh"),   # S5 in
    (31.0, "thud"),      # HELL NO impact
    (33.0, "pop"),       # NO AI card
    (34.92, "stamp"),    # S6 PROPOSAL stamp
    (38.5, "pop"),       # caveat label
    (41.62, "whoosh"),   # S7 in
    (43.0, "ding"),      # calendar 17
    (44.6, "riser"),     # LAST CALL
    (47.24, "whoosh"),   # S8 button
    (49.5, "ding"),      # question
]

SILENCE_DIP_AT = 46.6   # the breath before the button (pre-S8), >=6 dB under bed
DIP_LEN = 0.9


def main():
    os.makedirs(os.path.join(AUD, "sfx"), exist_ok=True)
    # 1) build SFX one-shots
    kinds = sorted(set(k for _, k in EVENTS))
    for k in kinds:
        sfx(os.path.join(AUD, "sfx", f"{k}.wav"), k)

    # 2) assemble inputs: [0]=VO padded to VIDEO, [1]=music looped/trimmed, then SFX
    inputs = ["-i", os.path.join(AUD, "vo.wav"), "-i", os.path.join(OUT, "music_bed.wav")]
    for t, k in EVENTS:
        inputs += ["-i", os.path.join(AUD, "sfx", f"{k}.wav")]

    fc = []
    # VO: pad to full length, keep dominant; split (one copy to mix, one as sidechain key)
    fc.append(f"[0:a]aformat=sample_rates={SR}:channel_layouts=stereo,apad=whole_dur={VIDEO_SECS},volume=1.0,asplit=2[vo][vok]")
    # Music: loop, trim, base level, with a scripted volume dip before the button
    dip0, dip1 = SILENCE_DIP_AT, SILENCE_DIP_AT + DIP_LEN
    fc.append(
        f"[1:a]aformat=sample_rates={SR}:channel_layouts=stereo,aloop=loop=-1:size={int(SR*200)},"
        f"atrim=0:{VIDEO_SECS},volume=0.32,"
        f"volume=enable='between(t,{dip0},{dip1})':volume=0.18[bedraw]"
    )
    # sidechain duck the bed under the VO (uses the key copy)
    fc.append(f"[bedraw][vok]sidechaincompress=threshold=0.04:ratio=9:attack=6:release=320:makeup=1[bed]")
    # SFX: delay each to its event time
    sfx_labels = []
    for i, (t, k) in enumerate(EVENTS):
        idx = 2 + i
        ms = int(t * 1000)
        lbl = f"s{i}"
        fc.append(f"[{idx}:a]aformat=sample_rates={SR}:channel_layouts=stereo,adelay={ms}|{ms},volume=0.5[{lbl}]")
        sfx_labels.append(f"[{lbl}]")
    # mix VO + bed + all sfx
    mix_in = "[vo][bed]" + "".join(sfx_labels)
    n = 2 + len(sfx_labels)
    fc.append(f"{mix_in}amix=inputs={n}:normalize=0:dropout_transition=0[premix]")
    # final loudness normalize + true-peak limit
    fc.append(f"[premix]loudnorm=I=-14:TP=-1.0:LRA=11,alimiter=limit=0.94[out]")

    filtergraph = ";".join(fc)
    master = os.path.join(AUD, "master.wav")
    run([FF, "-y", *inputs, "-filter_complex", filtergraph, "-map", "[out]",
         "-ar", str(SR), "-ac", "2", "-t", str(VIDEO_SECS), master])
    print("wrote", master)

    # write sfx_events.json for the gate
    json.dump({"events": [{"t": t, "kind": k} for t, k in EVENTS],
               "silence_dip_at": SILENCE_DIP_AT, "count": len(EVENTS)},
              open(os.path.join(AUD, "sfx_events.json"), "w"), indent=2)


if __name__ == "__main__":
    main()
