#!/usr/bin/env bash
# Alaska.Ai Dispatch routine — environment setup (idempotent, cached by the routine env).
# Point the routine's Environment > "Setup script" at:   bash scripts/setup_env.sh
# Installs everything the engine needs. Fonts are committed in the repo (no download).
set -uo pipefail

# ffmpeg
command -v ffmpeg >/dev/null 2>&1 || { apt-get update -qq && apt-get install -y -qq ffmpeg; }

# python deps (only install if missing)
python3 -c "import PIL,numpy,scipy,edge_tts,soundfile" >/dev/null 2>&1 \
  || pip install --break-system-packages -q pillow numpy scipy edge-tts soundfile
# kokoro (publish voice, Apache-2.0) — larger; install if missing
python3 -c "import kokoro" >/dev/null 2>&1 \
  || pip install --break-system-packages -q kokoro || true

# rclone (token-safe video upload -> one-click download link)
command -v rclone >/dev/null 2>&1 || { curl -fsSL https://rclone.org/install.sh | bash || true; }

# edge-tts TLS: append the system CA bundle to certifi (idempotent)
python3 - <<'PY'
import certifi, os
sysca="/etc/ssl/certs/ca-certificates.crt"
if os.path.exists(sysca):
    cur=open(certifi.where(),"rb").read(); add=open(sysca,"rb").read()
    if add[:160] not in cur: open(certifi.where(),"ab").write(b"\n"+add)
print("setup_env: ready")
PY
