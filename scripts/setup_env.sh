#!/usr/bin/env bash
# Alaska.Ai Dispatch routine — environment setup (idempotent, cached by the routine env).
# Point the routine's Environment > "Setup script" at:   bash scripts/setup_env.sh
# Installs everything the engine needs. Fonts are committed in the repo (no download).
set -uo pipefail

# ffmpeg
command -v ffmpeg >/dev/null 2>&1 || { apt-get update -qq && apt-get install -y -qq ffmpeg; }

# python deps (only install if missing)
python3 -c "import PIL,numpy,scipy,edge_tts,soundfile,yaml" >/dev/null 2>&1 \
  || pip install --break-system-packages -q pillow numpy scipy edge-tts soundfile pyyaml
# kokoro (publish voice, Apache-2.0) — larger; install if missing
python3 -c "import kokoro" >/dev/null 2>&1 \
  || pip install --break-system-packages -q kokoro || true

# rclone (token-safe video upload -> one-click download link)
command -v rclone >/dev/null 2>&1 || { curl -fsSL https://rclone.org/install.sh | bash || true; }

# TLS: append the system CA bundle AND (if present) the sandbox agent-proxy CA to certifi
# (idempotent). aiohttp — which edge-tts uses — prefers certifi's bundle over the system
# store, so patching only /etc/ssl/certs is not enough when egress is routed through a
# TLS-terminating proxy (see /root/.ccr/README.md). edge-tts ALSO needs `--proxy $HTTPS_PROXY`
# explicitly passed on each call in that environment — it does not read HTTPS_PROXY itself.
python3 - <<'PY'
import certifi, os
for ca in ("/etc/ssl/certs/ca-certificates.crt", "/root/.ccr/ca-bundle.crt"):
    if os.path.exists(ca):
        cur=open(certifi.where(),"rb").read(); add=open(ca,"rb").read()
        if add[:160] not in cur: open(certifi.where(),"ab").write(b"\n"+add)
print("setup_env: ready")
PY
