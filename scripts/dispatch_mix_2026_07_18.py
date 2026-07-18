#!/usr/bin/env python3
"""Mix the Dispatch master audio for 2026-07-18 "The Fence That Falls Short":
VO (dominant) + ducked music bed + SFX events, with a real pre-button silence
dip, normalized to -14 LUFS / TP <= -1.0 dBTP.
"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, ".."))
OUT = os.path.join(REPO, "out", "dispatch")
AUD = os.path.join(OUT, "audio")
FF = os.environ.get("FFMPEG_BIN", "ffmpeg")
SR = 44100
VIDEO_SECS = 1633 / 30  # matches Root durationInFrames after adding the pre-button breath gap


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.stderr.write(r.stderr[-2000:])
        raise SystemExit(f"ffmpeg failed: {' '.join(cmd[:6])}...")
    return r


def sfx(path, kind):
    # NOTE: these are lavfi sine/noise SOURCES at native amplitude 1.0 (0 dBFS);
    # any volume= here above ~0.85 clips at generation time, before any downstream
    # mixing or loudnorm ever runs. Keep every one comfortably under 1.0.
    if kind == "whoosh":
        f = "anoisesrc=d=0.5:c=pink:a=0.5,highpass=f=300,lowpass=f=3500,afade=t=in:d=0.05,afade=t=out:d=0.42,volume=0.55"
    elif kind == "thud":
        f = "sine=frequency=90:duration=0.28,afade=t=out:d=0.26,volume=0.7"
    elif kind == "pop":
        f = "sine=frequency=520:duration=0.12,afade=t=out:d=0.11,volume=0.55"
    elif kind == "ding":
        f = "sine=frequency=1200:duration=0.35,afade=t=out:d=0.33,volume=0.4"
    elif kind == "riser":
        f = "sine=frequency=220:duration=0.9,afade=t=in:d=0.85,volume=0.45"
    elif kind == "clank":
        f = "sine=frequency=180:duration=0.3,afade=t=out:d=0.28,volume=0.55"
    elif kind == "snap":
        f = "sine=frequency=900:duration=0.08,afade=t=out:d=0.07,volume=0.75"
    elif kind == "stamp":
        f = "sine=frequency=70:duration=0.3,afade=t=out:d=0.28,volume=0.75"
    elif kind == "tick":
        f = "sine=frequency=1500:duration=0.05,volume=0.4"
    elif kind == "creak":
        f = "sine=frequency=260:duration=0.4,afade=t=out:d=0.38,volume=0.4"
    elif kind == "chain":
        f = "sine=frequency=650:duration=0.2,afade=t=out:d=0.18,volume=0.4"
    elif kind == "paw":
        f = "sine=frequency=340:duration=0.09,afade=t=out:d=0.08,volume=0.35"
    else:
        f = "sine=frequency=440:duration=0.2,volume=0.4"
    run([FF, "-y", "-f", "lavfi", "-i", f, "-ac", "2", "-ar", str(SR), path])


# SFX events cut to the picture, derived from the VO line starts (out/dispatch/vo_lines.json)
# so they stay in sync with the actual synthesized timing. L[i] = start time of VO line i.
_lines = json.load(open(os.path.join(OUT, "vo_lines.json")))["lines"]
L = {x["idx"]: x["start"] for x in _lines}
EVENTS = [
    (L[0] + 0.05, "whoosh"),   # S1: aerial push begins, boundary starts drawing
    (L[0] + 1.10, "tick"),     # boundary line completes its draw
    (L[1] + 0.05, "clank"),    # gear-lever pulls (no price)
    (L[2] + 0.05, "paw"),      # S2: dogs trot in
    (L[3] + 0.05, "riser"),    # machine-shadow rises
    (L[3] + 1.20, "tick"),     # first icon stamp (data centers)
    (L[3] + 2.60, "tick"),     # rail hub stamp
    (L[3] + 4.00, "tick"),     # power lines stamp
    (L[4] + 0.10, "creak"),    # S3: blank nameplate swings
    (L[5] + 0.10, "clank"),    # Houston fence starts extending
    (L[6] + 0.30, "snap"),     # S4: MATCH-CUT, fence falls two miles short
    (L[6] + 0.35, "riser"),    # impact riser under the snap
    (L[7] + 0.60, "chain"),    # measuring chain pulls taut, 2 MI tag
    (L[8] + 0.10, "tick"),     # S5: pen begins to hover
    (L[9] + 0.20, "creak"),    # trail-post reveal, AUG 19
    (L[10] + 0.05, "whoosh"),  # S6: loopback aerial return begins
    (L[11] + 0.10, "paw"),     # dogs trot through the gap
    (L[12] + 0.05, "tick"),    # final settle
]

# quality_gate.py's SILENCE_DIP measures a window CENTERED on storyboard.json's audio_arc.silence_at
# (din = rms(t0-0.35,t0+0.35); neighborhood = rms(t0-3,t0-0.6) vs rms(t0+0.6,t0+3)). The dip must
# therefore be centered at t0 too, not started at t0 -- starting AT t0 put half the din window
# outside the ducked region and diluted the measured drop to ~2dB instead of the real ~18dB.
# True silent gap is [L[11].end, L[12].start] = [48.06, 49.66]s (1.6s). Center at 48.86s with a
# +/-0.55s dip half-width: dip covers [48.31,49.41], clear of both the gap edges (0.25s buffer
# each side) AND the gate's neighborhood windows (which start exactly at t0+/-0.6).
SILENCE_DIP_CENTER = 48.86
DIP_HALF = 0.55
SILENCE_DIP_AT = SILENCE_DIP_CENTER - DIP_HALF
DIP_LEN = 2 * DIP_HALF


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
        f"atrim=0:{VIDEO_SECS},volume=0.30[bedraw]"
    )
    fc.append(f"[bedraw][vok]sidechaincompress=threshold=0.04:ratio=9:attack=6:release=320:makeup=1[bedduck]")
    # the real pre-button silence dip, applied AFTER the sidechain (so its makeup gain can't
    # partially cancel it) as a single frame-evaluated expression (the earlier two-filter
    # enable='between(...)' chain measured only ~1-2 dB of actual dip, nowhere near the -6dB
    # the gate requires -- ffmpeg's per-filter enable/disable passthrough does not compose the
    # way that looked like it would on paper).
    fc.append(
        f"[bedduck]volume=eval=frame:volume='if(between(t,{dip0},{dip1}),0.12,1.0)'[bed]"
    )
    sfx_labels = []
    for i, (t, k) in enumerate(EVENTS):
        idx = 2 + i
        ms = max(0, int(t * 1000))
        lbl = f"s{i}"
        fc.append(f"[{idx}:a]aformat=sample_rates={SR}:channel_layouts=stereo,adelay={ms}|{ms},volume=0.5[{lbl}]")
        sfx_labels.append(f"[{lbl}]")
    mix_in = "[vo][bed]" + "".join(sfx_labels)
    n = 2 + len(sfx_labels)
    fc.append(f"{mix_in}amix=inputs={n}:normalize=0:dropout_transition=0[premix]")

    filtergraph = ";".join(fc)
    premix = os.path.join(AUD, "premix.wav")
    run([FF, "-y", *inputs, "-filter_complex", filtergraph, "-map", "[premix]",
         "-ar", str(SR), "-ac", "2", "-t", str(VIDEO_SECS), premix])

    import re

    def ebur128(path):
        r = subprocess.run([FF, "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                            capture_output=True, text=True)
        summary = r.stderr.rsplit("Summary:", 1)[-1]  # only the final summary, not per-window lines
        im = re.search(r"Integrated loudness:\s*\n\s*I:\s+(-?[\d.]+) LUFS", summary)
        tm = re.search(r"True peak:\s*\n\s*Peak:\s+(-?[\d.]+) dBFS", summary)
        return float(im.group(1)), float(tm.group(1))

    # 2-pass loudnorm: measure the premix, then apply with the MEASURED values (a single-pass
    # linear loudnorm without prior stats produces an unreliable gain).
    meas = subprocess.run([FF, "-i", premix, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json",
                            "-f", "null", "-"], capture_output=True, text=True)
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", meas.stderr, re.S)
    stats = json.loads(m.group(0))
    ln2 = (f"loudnorm=I=-14:TP=-1.5:LRA=11:"
           f"measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:"
           f"measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:linear=true")
    normed = os.path.join(AUD, "normed.wav")
    run([FF, "-y", "-i", premix, "-af", ln2, "-ar", str(SR), "-ac", "2", normed])

    # Guarantee the TP<=-1.0 dBTP gate with a measured trim (alimiter's lookahead limiter
    # proved unreliable on this peaky SFX content -- a few one-shots were generated already
    # clipped at 0 dBFS, see the sfx() volume fix above; trim is the deterministic fallback).
    integ, peak = ebur128(normed)
    trim_db = min(0.0, -1.8 - peak)  # target -1.8 dBFS sample peak for true-peak headroom
    master = os.path.join(AUD, "master.wav")
    run([FF, "-y", "-i", normed, "-af", f"volume={trim_db}dB", "-ar", str(SR), "-ac", "2", master])
    integ2, peak2 = ebur128(master)
    print(f"wrote {master} | pre-trim: I={integ:.2f} LUFS peak={peak:.2f} dBFS | "
          f"trim={trim_db:.2f} dB | FINAL: I={integ2:.2f} LUFS true_peak={peak2:.2f} dBFS")
    if peak2 > -1.0:
        print("WARNING: final true peak still above -1.0 dBTP gate", file=sys.stderr)

    json.dump({"events": [{"t": t, "kind": k} for t, k in EVENTS],
               "silence_dip_at": SILENCE_DIP_AT, "count": len(EVENTS)},
              open(os.path.join(AUD, "sfx_events.json"), "w"), indent=2)


if __name__ == "__main__":
    main()
