#!/usr/bin/env bash
# bootstrap.sh — idempotent dependency setup for the carousel engine.
# Chromium is pre-installed in the cloud environment (PLAYWRIGHT_BROWSERS_PATH);
# never run "playwright install".
set -e

python3 - <<'EOF'
import importlib, subprocess, sys
need = []
for mod, pkg in [("playwright", "playwright"), ("pypdf", "pypdf"),
                 ("img2pdf", "img2pdf"), ("PIL", "pillow"),
                 ("numpy", "numpy"), ("yaml", "pyyaml")]:
    try:
        importlib.import_module(mod)
    except ImportError:
        need.append(pkg)
if need:
    print("installing:", " ".join(need))
    subprocess.check_call([sys.executable, "-m", "pip", "install",
                           "--break-system-packages", "-q", *need])
else:
    print("all python deps present")
EOF

# sanity: a launchable chromium must exist
if ls /opt/pw-browsers/chromium*/chrome-linux/chrome >/dev/null 2>&1 || \
   command -v chromium >/dev/null 2>&1; then
  echo "chromium: ok"
else
  echo "WARNING: no chromium found under /opt/pw-browsers — render.py may fail" >&2
fi
echo "bootstrap complete"
