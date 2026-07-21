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
FF = os.environ.get("FFMPEG_BIN", "ffmpeg")
SR = 44100
# VIDEO_SECS is DERIVED from the VO timing below (never hardcode: a stale 1673f value
# would truncate or pad the 2026-07-20 1699f master). Set right after vo_lines loads.


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
_TAIL = 2.6   # matches scripts/build_scenes.py TAIL (hold after the last word)
VIDEO_SECS = max(x["end"] for x in _lines) + _TAIL   # derive from VO; never hardcode

# SFX events cut to THIS story's beats (Dryad / XPRIZE / Nenana autonomous wildfire
# drone), placed off VO line starts L[i] so they stay in sync if the narration
# retimes. Kinds resolve via the designed-foley bank (sfx_bank.py). >= 1 per scene,
# motivated per beat (docs: VOICE_AND_SCORE / the audio_arc block in storyboard.json).
EVENTS = [
    # S1: the question + the argument (The Referee Arrives, 2026-07-20b)
    (L[0] + 0.10, "tick"),     # the odometer's soft first click at the lens
    (L[0] + 0.55, "pop"),      # digit flips to 0001 (the hook's motion mark)
    (L[1] + 0.30, "whoosh"),   # pull-out swell: the argument revealed
    (L[1] + 2.30, "clank"),    # dueling tally cards slam in
    (L[1] + 3.60, "snap"),     # the raven plucks a tally stroke
    # S2: two honest banks
    (L[2] + 0.25, "creak"),    # the SMOKEHOUSE sign creaks over bare racks
    (L[2] + 3.30, "creak"),    # the swing sign creaks again over the racks
    (L[3] + 1.10, "whoosh"),   # the eager salmon fling
    (L[3] + 1.60, "pop"),      # the splash lands on the neighbor
    (L[3] + 3.90, "boom"),     # the cold ocean mass presses the run-curve down
    # S3: the counting room
    (L[4] + 0.20, "paper"),    # the paper storm burying the observer
    (L[4] + 1.30, "tick"),     # the human clock ticking slow
    (L[4] + 2.50, "thud"),     # pollock tower slams through the ceiling
    (L[5] + 1.70, "riser"),    # the brass head strafes the wall
    (L[5] + 2.70, "ding"),     # the clock lands on HOURS
    # S4: the lineup + the bill
    (L[6] + 1.00, "tick"),     # the clicker's first ratchet (85,000 latches)
    (L[6] + 3.85, "chime"),    # the 97% scorecard follows
    (L[6] + 6.00, "stamp"),    # STILL RESEARCH: hard metal die
    (L[7] + 0.40, "paper"),    # the bill page settles
    (L[7] + 2.40, "thud"),     # TRANSPARENCY: wet ink pad (distinct timbre)
    # S5: the referee + the boom-up
    (L[8] + 1.55, "klaxon"),   # the whistle blast (short, hushed after)
    (L[8] + 2.80, "snap"),     # the clicker zip-locks on the count
    (L[8] + 3.80, "riser"),    # the composed boom-up begins
    (L[8] + 6.20, "whoosh"),   # hollow wind over the empty river
    # S6: the count comes home + the button
    (L[10] + 0.80, "creak"),   # weir timber sways as she steps to the stake
    (L[10] + 2.55, "thud"),    # the weir stake driven home (wooden thunk)
    (L[10] + 3.40, "tick"),    # odometer +1 as a sockeye passes
    (L[10] + 4.90, "tick"),    # +2, the raven scratches its own tally
    (L[11] + 1.80, "tick"),    # the button's single soft click
    (L[11] + 2.90, "chime"),   # the warm resolve: YOU DO.
]

SILENCE_DIP_AT = L[11] - 0.62  # the breath before the button (the >=6dB gate dip)
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
        f"volume=enable='between(t,{dip0},{dip1})':volume=0.11,"
        f"volume=enable='between(t,{L[8] + 1.4},{L[8] + 3.2})':volume=0.13[bedraw]"
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
