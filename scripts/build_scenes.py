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

# scene -> index of the VO line that starts it. The current Episode has 6 scenes
# (S1..S6 in video-engine/src/Episode.tsx, SCENE_COMPONENTS), each spanning two VO
# lines except S6 which carries the final three (lines 10,11,12):
#   S1 lines 0-1  S2 lines 2-3  S3 lines 4-5  S4 lines 6-7  S5 lines 8-9  S6 lines 10-12
# (an earlier 8-entry list here silently mismatched SCENE_COMPONENTS.length, so Episode
# fell back to its hardcoded DEFAULT_BOUNDS and ignored this file's retimed scenes.)
SCENE_START_LINE = [0, 2, 4, 6, 8, 10]


def main():
    lines = json.load(open(os.path.join(OUT, "vo_lines.json")))["lines"]
    caps = json.load(open(os.path.join(OUT, "captions.json")))
    start = {L["idx"]: L["start"] for L in lines}
    last_end = max(L["end"] for L in lines)
    total_s = last_end + TAIL
    total_f = round(total_s * FPS)

    bounds = [round(start[si] * FPS) for si in SCENE_START_LINE]
    scenes = []
    for i, b in enumerate(bounds):
        end = bounds[i + 1] if i + 1 < len(bounds) else total_f
        scenes.append({"from": b, "dur": end - b})

    json.dump({"captions": caps, "scenes": scenes, "total": total_f},
              open(os.path.join(OUT, "episode_props.json"), "w"))
    print(f"total={total_f}f ({total_s:.2f}s)")
    for i, s in enumerate(scenes):
        print(f"  S{i+1}: from={s['from']} dur={s['dur']} ({s['dur']/FPS:.2f}s)")


if __name__ == "__main__":
    main()
