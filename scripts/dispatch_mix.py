#!/usr/bin/env python3
"""Mix the Dispatch master audio: VO (dominant) + ducked music bed + SFX events,
with a real pre-button silence dip, normalized to -14 LUFS / TP <= -1.0 dBTP.

SFX are resolved from the designed-foley bank (assets/sfx via scripts/sfx_bank.py).
Music ducks under VO via sidechaincompress.

2026-07-21 "The Pen That Won't Land" (KPBSD AI policy). Episode-local: this file is
rewritten per run with EVENTS matched to THIS story's beats/storyboard.json.
"""
import json, os, subprocess, sys, math

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, ".."))
OUT = os.path.join(REPO, "out", "dispatch")
AUD = os.path.join(OUT, "audio")
FF = os.environ.get("FFMPEG_BIN", "ffmpeg")
SR = 44100


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
# sync when the narration changes. L[i] = start time of VO line i (0-indexed, 9
# lines this run). Kinds resolve via the designed-foley bank (sfx_bank.py); every
# storyboard beat gets a motivated, concrete sound (never bare "music"/"sound").
_lines = json.load(open(os.path.join(OUT, "vo_lines.json")))["lines"]
L = {x["idx"]: x["start"] for x in _lines}
_TAIL = 2.6   # matches scripts/build_scenes.py TAIL (hold after the last word)
VIDEO_SECS = max(x["end"] for x in _lines) + _TAIL   # derive from VO; never hardcode

EVENTS = [
    # S1 (line 0): cold open — the machine at work beside the trembling pen
    (L[0] + 0.10, "chime"),    # soft classroom ambience swell
    (L[0] + 3.60, "tick"),     # the pen's faint tremble-tick on the easel
    # S2 (line 1): the tools at work
    (L[1] + 0.20, "pop"),      # keyboard-tap / margin-note pop-ins
    # S3 (line 2): the ledger — $8,300 + the paired stamps
    (L[2] + 0.10, "ding"),     # cash-register ding, the receipt tape unspools
    (L[2] + 2.60, "stamp"),    # the paired PAID/DRAFT stamp-thuds
    # S4 (line 3): the timeline gap
    (L[3] + 0.10, "creak"),    # the '2025' SwingSign creaks in
    (L[3] + 2.70, "chain"),    # the MeasuringChain pays out
    # S5 (line 4): the fork — Dendurent's ADAPTABLE lever
    (L[4] + 0.10, "riser"),    # footsteps + the tension riser begins
    (L[4] + 3.10, "snap"),     # the ADAPTABLE lever's rubber-band boing
    (L[4] + 5.70, "thud"),     # VanBuskirk's footstep-plant on CONCRETE
    # S6 (line 5): the payoff — CONCRETE bites
    (L[5] + 0.30, "clank"),    # the CONCRETE lever's hard mechanical clunk
    # S7 (line 6): the impasse
    (L[6] + 0.20, "clank"),    # the TallyCounter dial jams
    (L[6] + 1.50, "tick"),     # the held clock-tick
    # S8 (line 7): THE TURN — the floor-level paper stream
    (L[7] + 0.10, "whoosh"),   # the boom-drop reveal
    (L[7] + 2.00, "paper"),    # the continuous paper-rustle stream
    # S9 (line 8): button — the Raven, the loop closes
    (L[8] + 0.10, "paw"),      # the Raven's landing hop + ruffle
    (L[8] + 2.50, "whoosh"),   # the final gust as the pen puffs back up
]

SILENCE_DIP_AT = L[8] + 3.4  # the breath before "or describe it" (the >=6dB gate dip)
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
        f"atrim=0:{VIDEO_SECS},volume=0.30,"
        f"volume=enable='between(t,{dip0},{dip1})':volume=0.10,"
        f"volume=enable='between(t,{L[4] + 0.0},{L[4] + 2.0})':volume=0.13[bedraw]"
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
    fc.append(f"[premix]loudnorm=I=-14:TP=-1.2:LRA=11,alimiter=limit=0.86:level=false[out]")

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
