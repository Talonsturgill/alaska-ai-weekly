#!/usr/bin/env python3
"""Prove Pillow's C core loads under the python3 the pipeline runs, and repair it if not.

WHY THIS EXISTS (machine pass 2026-10-21, after it bit 10-20 and 10-21). setup_env.sh checked
`import PIL`, which passes whenever any PIL package is on the path. On both runs the package it
found could not load its compiled core (`cannot import name _imaging`): a Debian build for a
different interpreter shadowed the pip one, so the first real `from PIL import Image` was in
build_evidence.py, after a 9 to 20 minute render and encode. A check that imports the package
and not the extension is no check, so this one imports what build_evidence imports and draws.

Usage:
  python3 scripts/pillow_check.py            exit 0 when Pillow works, 1 when it does not
  python3 scripts/pillow_check.py --repair   reinstall into the first writable site dir on
                                             sys.path (ahead of the shadowing copy), re-check
  python3 scripts/pillow_check.py --self-test
"""
import os
import subprocess
import sys
import tempfile

PROBE = ("from PIL import Image, ImageChops, ImageDraw; "
         "im = Image.new('RGB', (4, 4), 'white'); ImageDraw.Draw(im).point((1, 1), 'black'); "
         "assert ImageChops.difference(im, Image.new('RGB', (4, 4), 'white')).getbbox()")


def works(env=None):
    r = subprocess.run([sys.executable, "-c", PROBE], capture_output=True, text=True, env=env)
    return r.returncode == 0, (r.stderr.strip().splitlines() or [""])[-1]


def site_target():
    """The first writable site/dist-packages directory on THIS interpreter's path."""
    for p in sys.path:
        if p.rstrip("/").endswith(("site-packages", "dist-packages")) and os.access(p, os.W_OK):
            return p
    return None


def repair():
    cmd = [sys.executable, "-m", "pip", "install", "--break-system-packages", "-q",
           "--upgrade", "--force-reinstall", "--no-deps", "pillow"]
    target = site_target()
    if target:
        cmd[-1:-1] = ["--target", target]
    print("pillow_check: repairing with", " ".join(cmd[1:]))
    subprocess.run(cmd, check=False)


def _self_test():
    ok_now, why = works()
    with tempfile.TemporaryDirectory() as d:
        os.makedirs(os.path.join(d, "PIL"))
        with open(os.path.join(d, "PIL", "__init__.py"), "w") as f:
            f.write("__version__ = '0-shadow'\n")
        with open(os.path.join(d, "PIL", "Image.py"), "w") as f:
            f.write("from . import _imaging as core\n")
        env = dict(os.environ, PYTHONPATH=d)
        bare = subprocess.run([sys.executable, "-c", "import PIL"], env=env).returncode == 0
        caught = not works(env)[0]
    checks = [(bare, "a shadowing PIL with no C core still passes the old `import PIL` check"),
              (caught, "this probe fails on it"),
              (ok_now, f"the probe passes on this interpreter's real Pillow {why}")]
    for ok, what in checks:
        print(f"  [{'x' if ok else ' '}] {what}")
    ok = all(c for c, _ in checks)
    print("SELF-TEST", "PASS" if ok else "FAIL")
    return 0 if ok else 1


def main():
    if "--self-test" in sys.argv:
        return _self_test()
    ok, why = works()
    if ok:
        print(f"pillow_check: Pillow loads its C core under {sys.executable}")
        return 0
    print(f"pillow_check: Pillow is BROKEN under {sys.executable}: {why}")
    if "--repair" not in sys.argv:
        return 1
    repair()
    ok, why = works()
    print("pillow_check:", "repaired" if ok else f"STILL BROKEN after repair: {why}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
