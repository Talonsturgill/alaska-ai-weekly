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
# DIMENSIONAL ENGINE (3D): taichi is the primary renderer (CPU JIT, ~0.45s/frame @1080x1920)
python3 -c "import taichi" >/dev/null 2>&1 \
  || pip install --break-system-packages -q taichi
# bpy = Blender-as-module for Workbench mesh renders + Cycles hero bakes (large wheel, best-effort)
python3 -c "import bpy" >/dev/null 2>&1 \
  || pip install --break-system-packages -q bpy || true
# software-GL for bpy Workbench headless (llvmpipe); best-effort
ldconfig -p 2>/dev/null | grep -q libEGL.so.1 \
  || { apt-get update -qq && apt-get install -y -qq libegl1 libgl1 libgles2 libgl1-mesa-dri; } || true
# kokoro (preset-voice fallback, Apache-2.0) — larger; install if missing
python3 -c "import kokoro" >/dev/null 2>&1 \
  || pip install --break-system-packages -q kokoro || true

# ---- OWNER-VOICE CLONE STACK (publish primary; see config/voices.yaml) ----
# Chatterbox (MIT, the engine Voicebox bundles) in a DEDICATED VENV because the
# Debian-patched system setuptools breaks the antlr4 sdist build (install_layout
# AttributeError) under the system python. Run VO builds with $VOICE_PY.
# Proven on this env 2026-07-14: torch 2.6.0+cpu, weights pull from HF fine.
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="$REPO_DIR/.venv-voice"
VOICE_PY="$VENV_DIR/bin/python"
if [ ! -x "$VOICE_PY" ] || ! "$VOICE_PY" -c "import chatterbox" >/dev/null 2>&1; then
  python3 -m venv "$VENV_DIR" \
    && "$VENV_DIR/bin/pip" install -q -U pip wheel \
    && "$VENV_DIR/bin/pip" install -q "setuptools<81" \
    && "$VENV_DIR/bin/pip" install -q chatterbox-tts edge-tts soundfile scipy numpy \
         --extra-index-url https://download.pytorch.org/whl/cpu \
    || echo "setup_env: WARN voice venv install failed (kokoro/edge fallback will be used)"
fi
# setuptools<81 matters: resemble-perth (chatterbox's watermarker) imports
# pkg_resources, removed in newer setuptools -> PerthImplicitWatermarker=None crash.
"$VOICE_PY" -c "import setuptools,pkg_resources" >/dev/null 2>&1 \
  || "$VENV_DIR/bin/pip" install -q "setuptools<81" || true

# rclone (token-safe video upload -> one-click download link)
command -v rclone >/dev/null 2>&1 || { curl -fsSL https://rclone.org/install.sh | bash || true; }

# edge-tts TLS: append the system + agent-proxy CA bundles to certifi (idempotent)
# — for BOTH pythons (system + voice venv); aiohttp/hf_hub read certifi, not SSL_CERT_FILE.
for PYBIN in python3 "$VOICE_PY"; do
  [ -x "$(command -v "$PYBIN" 2>/dev/null || echo "$PYBIN")" ] || continue
  "$PYBIN" - <<'PY' || true
import certifi, os
for src in ("/etc/ssl/certs/ca-certificates.crt", "/root/.ccr/ca-bundle.crt"):
    if os.path.exists(src):
        cur=open(certifi.where(),"rb").read(); add=open(src,"rb").read()
        if add[:160] not in cur: open(certifi.where(),"ab").write(b"\n"+add)
print("certifi CA ok:", certifi.where())
PY
done
echo "setup_env: ready"
