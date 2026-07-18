#!/usr/bin/env python3
"""VO ENVELOPE — turn the finished narration into ACTING data.

Reads out/dispatch/audio/vo.wav (the sound-checked winning take) and emits:

  out/dispatch/mouth_track.json
      {"fps": 30, "values": [0..1 per frame]}  — smoothed RMS amplitude of the
      voice, per video frame. Drives TalkMouth flaps + any "reacting to the
      voice" motion (lib/voice.tsx).

  out/dispatch/accents.json
      [{"frame": int, "word": str, "energy": 1-5, "lineIdx": int}]
      One accent per VO line: the vo-director's EMPHASIS word (vo_direction.json),
      located in time via words.json. Characters flinch, chips pop, and gestures
      key off these exact frames — beat-synced acting from data we already have.

build_scenes.py folds both into episode_props.json.
"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, ".."))
OUT = os.path.join(REPO, "out", "dispatch")
AUD = os.path.join(OUT, "audio")
FPS = 30


def _norm(w):
    return re.sub(r"[^a-z0-9']", "", w.lower())


def mouth_track(wav_path):
    import numpy as np
    from scipy.io import wavfile
    sr, data = wavfile.read(wav_path)
    if data.ndim > 1:
        data = data.mean(axis=1)
    x = data.astype(np.float64)
    if x.size and np.max(np.abs(x)) > 0:
        x = x / np.max(np.abs(x))
    hop = int(sr / FPS)
    n = max(1, int(np.ceil(x.size / hop)))
    rms = np.zeros(n)
    for i in range(n):
        seg = x[i * hop:(i + 1) * hop]
        rms[i] = np.sqrt(np.mean(seg * seg)) if seg.size else 0.0
    # perceptual-ish curve + normalize to the loud parts, then smooth (attack fast,
    # release slower — mouths snap open and ease closed)
    ref = np.percentile(rms[rms > 0], 92) if np.any(rms > 0) else 1.0
    env = np.clip(rms / max(ref, 1e-6), 0, 1) ** 0.7
    sm = np.zeros_like(env)
    v = 0.0
    for i, e in enumerate(env):
        v = max(e, v * 0.72)  # fast attack, ~4-frame release
        sm[i] = v
    # gate the floor so silence is fully closed
    sm[sm < 0.08] = 0.0
    return [round(float(v), 3) for v in sm]


def accents():
    """EMPHASIS word per line (vo_direction.json) -> onset frame via words.json."""
    try:
        plan = json.load(open(os.path.join(OUT, "vo_direction.json")))
        words = json.load(open(os.path.join(AUD, "words.json")))["words"]
    except FileNotFoundError:
        return []
    out = []
    for line in plan.get("lines", []):
        emph = _norm(str(line.get("emphasis", "")).split()[0]) if line.get("emphasis") else ""
        if not emph:
            continue
        li = line.get("idx", 0)
        cand = [w for w in words if w.get("seg") == li and _norm(w["w"]).startswith(emph)]
        if not cand:  # fall back to any-line match in order
            cand = [w for w in words if _norm(w["w"]).startswith(emph)]
        if cand:
            w = cand[0]
            out.append({"frame": int(round(w["s"] * FPS)), "word": w["w"].strip(",.!?"),
                        "energy": int(line.get("energy", 3)), "lineIdx": li})
    return out


def main():
    wav = os.path.join(AUD, "vo.wav")
    values = mouth_track(wav)
    json.dump({"fps": FPS, "values": values}, open(os.path.join(OUT, "mouth_track.json"), "w"))
    acc = accents()
    json.dump(acc, open(os.path.join(OUT, "accents.json"), "w"), indent=2)
    import numpy as np
    arr = np.array(values)
    talk = float((arr > 0.1).mean())
    print(f"mouth_track: {len(values)} frames ({len(values)/FPS:.1f}s), talking {talk*100:.0f}% of frames, peak {arr.max():.2f}")
    print(f"accents: {len(acc)} -> {[(a['word'], a['frame']) for a in acc][:8]}")


if __name__ == "__main__":
    main()
