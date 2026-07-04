#!/usr/bin/env bash
# Encode the two post-masters from the rendered frames + audio master:
#   dispatch_9x16.mp4  1080x1920 (TikTok, plays full-screen on LinkedIn mobile)
#   dispatch_4x5.mp4   1080x1350 (LinkedIn feed crop, centered 4:5 safe box)
# H.264 High, faststart, AAC 48k, audio already normalized to -14 LUFS.
# Bitrate capped so each ~64s cut stays UNDER 100 MB (GitHub hosting limit).
set -euo pipefail
cd "$(dirname "$0")"

FR=frames_v3
AUD=audio/master60.wav
FPS=30

nframes=$(ls "$FR"/frame_*.png | wc -l)
echo "encoding from $nframes frames + $AUD"

# 9:16 master (native)
ffmpeg -y -framerate $FPS -i "$FR/frame_%05d.png" -i "$AUD" \
  -map 0:v -map 1:a \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -preset medium \
  -maxrate 11M -bufsize 22M -movflags +faststart \
  -c:a aac -b:a 192k -ar 48000 \
  -shortest dispatch_9x16.mp4 2>enc_9x16.log

# 4:5 crop (1080x1350), centered vertically on the 4:5 safe box (y offset = (1920-1350)/2 = 285)
ffmpeg -y -framerate $FPS -i "$FR/frame_%05d.png" -i "$AUD" \
  -map 0:v -map 1:a \
  -vf "crop=1080:1350:0:285" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -preset medium \
  -maxrate 11M -bufsize 22M -movflags +faststart \
  -c:a aac -b:a 192k -ar 48000 \
  -shortest dispatch_4x5.mp4 2>enc_4x5.log

echo "=== sizes ==="
ls -lh dispatch_9x16.mp4 dispatch_4x5.mp4
echo "=== 9x16 probe ==="
ffprobe -v error -show_entries format=duration,size:stream=width,height,codec_name -of default=noprint_wrappers=1 dispatch_9x16.mp4
echo "=== 4x5 probe ==="
ffprobe -v error -show_entries stream=width,height -of csv=p=0 dispatch_4x5.mp4
