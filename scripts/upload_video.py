"""Upload the finished Dispatch mp4 -> one-click DIRECT-download URL (last stdout line = URL).

Token-safe: bytes go over the network from the container, NEVER through the model as base64.

Order of preference (so delivery NEVER hard-blocks on a missing secret):
  1) rclone remote (PERMANENT) when RCLONE_CONFIG_B64 / RCLONE_CONFIG is set and rclone is
     installed -- Google Drive / S3 / R2 / Dropbox / ...
  2) NO-AUTH FALLBACK to a temporary public host (tmpfiles.org). Links last ~1 hour, which is
     fine for the human-review Gmail draft. Set up rclone for permanent links.

The script prints `HOST=permanent|temporary` to stderr so the routine can note a temporary link
in the draft. It also VERIFIES the URL serves HTTP 200 before printing it.

rclone setup (routine env): install rclone in the setup script, then provide RCLONE_CONFIG_B64
(base64 of an rclone.conf with a remote named "dispatch"); Drive recommended. For a public
S3/R2 bucket set DISPATCH_PUBLIC_BASE to its public base URL.

Usage:
  python scripts/upload_video.py --file out/dispatch/dispatch.mp4 --name dispatch-2026-06-27.mp4
"""
import argparse, base64, os, subprocess, sys, tempfile, re, json

def sh(cmd, **kw): return subprocess.run(cmd, capture_output=True, text=True, **kw)
def have_rclone(): return sh(["which", "rclone"]).returncode == 0
def rclone_configured(): return bool(os.environ.get("RCLONE_CONFIG_B64") or os.environ.get("RCLONE_CONFIG"))

def ensure_config():
    b64 = os.environ.get("RCLONE_CONFIG_B64")
    if b64:
        path = os.path.join(tempfile.gettempdir(), "rclone_dispatch.conf")
        open(path, "wb").write(base64.b64decode(b64)); os.environ["RCLONE_CONFIG"] = path
    return os.environ.get("RCLONE_CONFIG")

def to_direct(url):
    m = re.search(r"/d/([A-Za-z0-9_-]+)", url) or re.search(r"[?&]id=([A-Za-z0-9_-]+)", url)
    if "drive.google.com" in url and m:
        return f"https://drive.google.com/uc?export=download&id={m.group(1)}"
    return url

def via_rclone(file, name):
    ensure_config()
    remote = os.environ.get("DISPATCH_REMOTE", "dispatch:"); dest = f"{remote}{name}"
    up = sh(["rclone", "copyto", file, dest, "--no-traverse"])
    if up.returncode != 0: raise RuntimeError("rclone upload failed: " + up.stderr[-400:])
    pub = os.environ.get("DISPATCH_PUBLIC_BASE")
    if pub: return f"{pub.rstrip('/')}/{name}"
    ln = sh(["rclone", "link", dest])
    if ln.returncode != 0: raise RuntimeError("rclone link failed: " + ln.stderr[-400:])
    return to_direct(ln.stdout.strip())

def via_tmpfiles(file):
    r = sh(["curl", "-sS", "--max-time", "300", "-F", f"file=@{file}", "https://tmpfiles.org/api/v1/upload"])
    if r.returncode != 0: raise RuntimeError("tmpfiles curl failed: " + (r.stderr or "")[-300:])
    try: u = json.loads(r.stdout)["data"]["url"]
    except Exception: raise RuntimeError("tmpfiles parse failed: " + (r.stdout or "")[:200])
    return u.replace("tmpfiles.org/", "tmpfiles.org/dl/")

def verify(url):
    r = sh(["curl", "-sSL", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "120", url])
    return (r.stdout or "").strip() == "200"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", required=True); ap.add_argument("--name", default=None)
    a = ap.parse_args(); name = a.name or os.path.basename(a.file)
    url = None; kind = None; errs = []
    if rclone_configured() and have_rclone():
        try: url, kind = via_rclone(a.file, name), "permanent"
        except Exception as e: errs.append("rclone: " + str(e))
    if not url:
        try: url, kind = via_tmpfiles(a.file), "temporary"
        except Exception as e: errs.append("tmpfiles: " + str(e))
    if not url:
        print("ERROR: all upload hosts failed:\n  " + "\n  ".join(errs), file=sys.stderr); sys.exit(1)
    ok = verify(url)
    print(f"HOST={kind} VERIFIED={'200' if ok else 'FAILED'}", file=sys.stderr)
    if not ok:
        print("WARNING: link did not verify HTTP 200 - re-upload/retry before creating the draft", file=sys.stderr)
        sys.exit(3)
    print(url)   # LAST line = the URL the routine captures

if __name__ == "__main__":
    main()
