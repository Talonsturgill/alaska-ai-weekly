"""Merge re-rendered telemetry into the full-run manifest + correct the arch claim.
Re-rendered ranges: [0,80) and [306,627). Old samples elsewhere, new samples inside.
arch: taichi fell back to x64 (DIM_ARCH=cuda had no GPU) — record cpu, honestly."""
import json
old = json.load(open("out/dispatch/render_manifest_full.json"))
new = json.load(open("out/dispatch/render_manifest.json"))
RANGES = [(0, 80), (306, 627)]
def rerendered(f):
    return any(a <= f < b for a, b in RANGES)
merged = [s for s in old["samples"] if not rerendered(s["f"])] + [s for s in new["samples"] if rerendered(s["f"])]
merged.sort(key=lambda s: s["f"])
out = dict(old)
out["samples"] = merged
out["arch"] = "cpu"          # honest: taichi logged 'Starting on arch=x64' (cuda fallback)
out["arch_note"] = "DIM_ARCH=cuda was set but no GPU present; taichi fell back to x64"
json.dump(out, open("out/dispatch/render_manifest.json", "w"), indent=1)
import shutil
shutil.copy("out/dispatch/render_manifest.json", ".claude/skills/alaska-dispatch/render_manifest.json")
spreads = [s["z_p90"] - s["z_p10"] for s in merged]
bad = sum(1 for v in spreads if v < 1.0)
print(f"merged {len(merged)} samples; below-1.0 spread: {bad} ({100*bad/len(merged):.0f}%) — need <20%")
