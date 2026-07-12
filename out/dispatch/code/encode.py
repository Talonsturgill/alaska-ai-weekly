"""encode.py — mux the rendered frames + master audio into the two delivery cuts:
  dispatch_916.mp4   1080x1920 (TikTok / full-screen LinkedIn mobile)
  dispatch_45.mp4    1080x1350 (LinkedIn feed) — centered 4:5 crop of the 9:16 master
Both: H.264 High, yuv420p, +faststart, AAC 48k, already -14 LUFS from the mix. Target < 100 MB.
"""
import os, subprocess, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
D = os.path.join(ROOT, "out", "dispatch")
FRAMES = os.path.join(D, "frames_v3", "frame_%05d.png")
AUD = os.path.join(D, "audio", "master60.wav")
FPS = 30

def run(cmd):
    print("+", " ".join(cmd[:6]), "...")
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        print("FFMPEG FAIL:\n", r.stderr[-1500:]); sys.exit(1)

def sz(p):
    return f"{os.path.getsize(p)/1e6:.1f} MB" if os.path.exists(p) else "MISSING"

# 9:16 master
v916 = os.path.join(D, "dispatch_916.mp4")
run(["ffmpeg", "-y", "-framerate", str(FPS), "-i", FRAMES, "-i", AUD,
     "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-crf", "19",
     "-preset", "medium", "-movflags", "+faststart",
     "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
     "-shortest", "-r", str(FPS), v916])

# 4:5 feed crop (centered vertically: 1080x1350 from 1080x1920, y offset 285)
v45 = os.path.join(D, "dispatch_45.mp4")
run(["ffmpeg", "-y", "-framerate", str(FPS), "-i", FRAMES, "-i", AUD,
     "-vf", "crop=1080:1350:0:285",
     "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-crf", "19",
     "-preset", "medium", "-movflags", "+faststart",
     "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
     "-shortest", "-r", str(FPS), v45])

print(f"9:16 {v916}  {sz(v916)}")
print(f"4:5  {v45}  {sz(v45)}")
