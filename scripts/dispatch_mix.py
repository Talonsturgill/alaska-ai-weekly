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
VIDEO_SECS = 1673/30  # match Root durationInFrames (1673f)


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.stderr.write(r.stderr[-2000:])
        raise SystemExit(f"ffmpeg failed: {' '.join(cmd[:6])}...")
    return r


def sfx(path, kind):
    """Resolve a named effect from the designed-foley bank (assets/sfx via
    scripts/sfx_bank.py: real/ recording > synth bank > self-heal rebuild).
    Bank files are 44.1k stereo, -6 dBFS peak — keep per-event volume <= 0.9."""
    import shutil as _sh, sys as _sys, os as _os
    _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
    from sfx_bank import resolve as _resolve
    _sh.copyfile(_resolve(kind), path)

# SFX events cut to the picture, derived from the VO line starts so they stay in
# sync when the narration changes. L[i] = start time of VO line i.
_lines = json.load(open(os.path.join(OUT, "vo_lines.json")))["lines"]
L = {x["idx"]: x["start"] for x in _lines}
EVENTS = [
    (L[0] + 0.10, "whoosh"),   # S1 machine appears
    (L[1] + 1.80, "pop"),      # square mile
    (L[1] + 3.80, "riser"),    # plug reaches / gigawatt
    (L[2] + 0.00, "whoosh"),   # S2 in
    (L[2] + 3.30, "ding"),     # +30% badge
    (L[3] + 0.00, "whoosh"),   # S3 in
    (L[3] + 2.50, "pop"),      # $500M
    (L[3] + 4.10, "thud"),     # $10B leaps
    (L[4] + 0.00, "klaxon"),   # S4 revolt
    (L[4] + 1.40, "paper"),    # paper storm
    (L[4] + 2.60, "ding"),     # 500+ badge
    (L[5] + 0.00, "whoosh"),   # S5 in ("Some kept it short.")
    (L[5] + 0.60, "thud"),     # HELL NO bubble lands (silent hold)
    (L[5] + 1.70, "pop"),      # NO AI card (silent hold)
    (L[5] + 3.40, "riser"),    # snap-zoom onto the face (closing punctuation)
    (L[6] + 0.00, "stamp"),    # S6 PROPOSAL stamp
    (L[6] + 3.60, "pop"),      # caveat label
    (L[7] + 0.00, "whoosh"),   # S7 in
    (L[7] + 1.40, "ding"),     # calendar 17
    (L[7] + 3.00, "riser"),    # LAST CALL
    (L[8] + 0.00, "whoosh"),   # S8 button
    (L[8] + 2.30, "ding"),     # question CTA
]

SILENCE_DIP_AT = L[8] - 0.6   # the breath just before the button
DIP_LEN = 0.8


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
