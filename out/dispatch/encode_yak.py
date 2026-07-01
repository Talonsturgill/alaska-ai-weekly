"""Encode the Yakutat Dispatch: 9:16 hero (1080x1920) + 4:5 LinkedIn cut (1080x1350).
Muxes frames_yakutat/ with the finished audio/master60.wav (already loudnorm -14 LUFS / -1.5 dBTP).
H.264 High, yuv420p, +faststart, AAC 48k. Bitrate capped so each file stays < 100 MB (GitHub push limit).

4:5 note: the composition's eyebrow (top, y~74) and captions (bottom, y~1500) span >1350px, so NO
center-crop can hold both. We preserve the ENTIRE 9:16 frame sharp+centered and fill the 4:5 margins
with a darkened, blurred copy of the frame (a deep surround; the crimson edge blooms faintly into the
sides). Nothing load-bearing is ever cropped away.
"""
import os, subprocess, sys, json
HERE = os.path.dirname(os.path.abspath(__file__)); AUD = os.path.join(HERE, "audio")
FRAMES = os.path.join(HERE, "frames_yakutat", "frame_%05d.png")
MASTER = os.path.join(AUD, "master60.wav")
VBASE = ["-c:v", "libx264", "-profile:v", "high", "-level", "4.2", "-pix_fmt", "yuv420p",
         "-preset", "slow", "-crf", "20", "-maxrate", "10M", "-bufsize", "20M"]
ABASE = ["-c:a", "aac", "-b:a", "192k", "-ar", "48000"]
def run(c): return subprocess.run(c, capture_output=True, text=True)
def size_mb(p): return os.path.getsize(p) / (1024 * 1024)

# ---- 9:16 hero (native 1080x1920) ----
out916 = os.path.join(HERE, "dispatch_yakutat_916.mp4")
c916 = ["ffmpeg", "-y", "-framerate", "30", "-i", FRAMES, "-i", MASTER,
        "-map", "0:v", "-map", "1:a", *VBASE, *ABASE,
        "-movflags", "+faststart", "-shortest", out916]
r = run(c916)
if r.returncode: print("916 FAIL\n", r.stderr[-1200:]); sys.exit(1)
print(f"9:16  -> {out916}  {size_mb(out916):.1f} MB")

# ---- 4:5 LinkedIn cut (1080x1350): full frame sharp+centered, darkened blurred surround ----
out45 = os.path.join(HERE, "dispatch_yakutat_45.mp4")
vf45 = ("[0:v]split=2[bg][fg];"
        "[bg]scale=1080:1350:force_original_aspect_ratio=increase,crop=1080:1350,"
        "boxblur=24:2,eq=brightness=-0.14:saturation=0.65[bgb];"
        "[fg]scale=-2:1350[fgs];"
        "[bgb][fgs]overlay=(W-w)/2:0,setsar=1[v]")
c45 = ["ffmpeg", "-y", "-framerate", "30", "-i", FRAMES, "-i", MASTER,
       "-filter_complex", vf45, "-map", "[v]", "-map", "1:a", *VBASE, *ABASE,
       "-movflags", "+faststart", "-shortest", out45]
r = run(c45)
if r.returncode: print("45 FAIL\n", r.stderr[-1200:]); sys.exit(1)
print(f"4:5   -> {out45}  {size_mb(out45):.1f} MB")

# ---- verify: duration, dims, audio present, size < 100 MB ----
def probe(p):
    r = run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
             "stream=width,height,nb_frames,duration", "-of", "json", p])
    v = json.loads(r.stdout)["streams"][0]
    ra = run(["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries",
              "stream=codec_name,sample_rate,duration", "-of", "json", p])
    a = json.loads(ra.stdout).get("streams", [{}])
    return v, (a[0] if a else {})
for p, wh in ((out916, (1080, 1920)), (out45, (1080, 1350))):
    v, a = probe(p)
    ok = (int(v["width"]), int(v["height"])) == wh and a.get("codec_name") == "aac" and size_mb(p) < 99
    print(f"  check {os.path.basename(p)}: {v['width']}x{v['height']} vdur={v.get('duration')} "
          f"audio={a.get('codec_name')}@{a.get('sample_rate')} {size_mb(p):.1f}MB  {'OK' if ok else 'PROBLEM'}")
    if not ok: sys.exit(2)
print("ENCODE OK")
