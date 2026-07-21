#!/usr/bin/env python3
"""Compute scene frame boundaries from the VO line timings so the timeline stays
in sync with the narration automatically. Scene i begins at the start of a mapped
VO line; S1 covers lines 0-1. Writes episode_props.json {captions, scenes, total}.
"""
import json, os

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(REPO, "out", "dispatch")
FPS = 30
TAIL = 2.6  # hold after the last word

# scene -> index of the VO line that starts it. 2026-07-21 "The Pen That Won't Land"
# has 9 scenes (S1..S9 in video-engine/src/Episode.tsx, SCENE_COMPONENTS) mapped 1:1
# to the 9 VO lines (vo_script.json has exactly 9 lines this run):
#   S1 line 0  S2 line 1  S3 line 2  S4 line 3  S5 line 4  S6 line 5  S7 line 6  S8 line 7  S9 line 8
# (an earlier list here silently mismatched SCENE_COMPONENTS.length, so Episode fell
# back to its hardcoded DEFAULT_BOUNDS and ignored this file's retimed scenes -- keep
# this list's length equal to SCENE_COMPONENTS.length every run.)
# 2026-07-21c beluga run: 10 VO lines mapped to 9 scenes; S4 (the robot eye) spans lines
# 3-4 (the look + the ear-and-eye stereo payoff), so line 4 has no scene of its own.
SCENE_START_LINE = [0, 1, 2, 3, 5, 6, 7, 8, 9]


def _apply_caption_fixups(caps):
    """On-screen captions are force-aligned from Whisper's transcript of the
    PHONETICALLY-respelled audio, so proper-noun respellings ('Ex Prize', 'DRY-ad',
    'Nana' for Nenana) leak onto screen as typos (the 2026-07-20 panel caught all three
    as hard blockers). vo_script.json declares a `caption_fixups` {phonetic: display}
    map; apply it to every cue text (case-insensitive, word-boundary) so the REAL
    spelling always shows. Permanent pipeline fix so no future run leaks a respelling."""
    import re as _re
    sp = os.path.join(OUT, "vo_script.json")
    fixups = json.load(open(sp)).get("caption_fixups", {}) if os.path.exists(sp) else {}
    if not fixups:
        return caps
    # Use alnum lookarounds, NOT \b: \b fails on tokens whose edge char is punctuation
    # (e.g. "A.I." ends in '.', so \b after it never matches and the fixup silently no-ops —
    # the 2026-07-21c panel caught "A.I." leaking on screen while NOAA/GAIA normalized fine).
    # Longest keys first so a key that is a prefix of another can't pre-empt it.
    for c in caps:
        t = c.get("text", "")
        for wrong, right in sorted(fixups.items(), key=lambda kv: -len(kv[0])):
            t = _re.sub(r"(?<![A-Za-z0-9])" + _re.escape(wrong) + r"(?![A-Za-z0-9])", right, t, flags=_re.IGNORECASE)
        c["text"] = t
    return caps


def main():
    lines = json.load(open(os.path.join(OUT, "vo_lines.json")))["lines"]
    caps = _apply_caption_fixups(json.load(open(os.path.join(OUT, "captions.json"))))
    start = {L["idx"]: L["start"] for L in lines}
    last_end = max(L["end"] for L in lines)
    total_s = last_end + TAIL
    total_f = round(total_s * FPS)

    bounds = [round(start[si] * FPS) for si in SCENE_START_LINE]
    scenes = []
    for i, b in enumerate(bounds):
        end = bounds[i + 1] if i + 1 < len(bounds) else total_f
        scenes.append({"from": b, "dur": end - b})

    props = {"captions": caps, "scenes": scenes, "total": total_f}
    # voice-acting data (scripts/vo_envelope.py): per-frame mouth envelope + the
    # vo-director's emphasis accents, for lib/voice.tsx. Optional, additive.
    mt = os.path.join(OUT, "mouth_track.json")
    ac = os.path.join(OUT, "accents.json")
    if os.path.exists(mt):
        props["mouth"] = json.load(open(mt))["values"]
    if os.path.exists(ac):
        props["accents"] = json.load(open(ac))
    json.dump(props, open(os.path.join(OUT, "episode_props.json"), "w"))
    print(f"total={total_f}f ({total_s:.2f}s)  mouth={'y' if 'mouth' in props else 'n'} accents={len(props.get('accents', []))}")
    for i, s in enumerate(scenes):
        print(f"  S{i+1}: from={s['from']} dur={s['dur']} ({s['dur']/FPS:.2f}s)")


if __name__ == "__main__":
    main()
