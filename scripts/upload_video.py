"""Upload the finished Dispatch mp4 and print a one-click DIRECT-download URL.

Token-safe by design: bytes go over the network from the container; they NEVER
pass through the model as base64.

Primary: rclone (Drive/S3/R2/Dropbox). Set RCLONE_CONFIG_B64 in the routine env.
Fallback: git-push to the repo's `dispatch-media` branch on GitHub → permanent
  raw.githubusercontent.com link (zero setup, < 100 MB files).

Usage:
  python scripts/upload_video.py --file out/dispatch/dispatch.mp4 --name dispatch-2026-06-27.mp4
  python scripts/upload_video.py --file out/dispatch/dispatch_4x5.mp4 --name dispatch-2026-06-27-4x5.mp4
"""
import argparse, base64, os, subprocess, sys, tempfile, re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
MEDIA_BRANCH = "dispatch-media"
GITHUB_OWNER = "talonsturgill"
GITHUB_REPO = "alaska-ai-weekly"

def sh(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)

def ensure_rclone_config():
    b64 = os.environ.get("RCLONE_CONFIG_B64")
    if b64:
        path = os.path.join(tempfile.gettempdir(), "rclone_dispatch.conf")
        open(path, "wb").write(base64.b64decode(b64))
        os.environ["RCLONE_CONFIG"] = path
    return os.environ.get("RCLONE_CONFIG")

def to_direct(url):
    m = re.search(r"/d/([A-Za-z0-9_-]+)", url) or re.search(r"[?&]id=([A-Za-z0-9_-]+)", url)
    if "drive.google.com" in url and m:
        return f"https://drive.google.com/uc?export=download&id={m.group(1)}"
    return url

def upload_rclone(filepath, name):
    """Upload via rclone; return direct-download URL or None."""
    if sh(["which", "rclone"]).returncode != 0:
        return None
    ensure_rclone_config()
    remote = os.environ.get("DISPATCH_REMOTE", "dispatch:")
    dest = f"{remote}{name}"
    up = sh(["rclone", "copyto", filepath, dest, "--no-traverse"])
    if up.returncode != 0:
        print(f"rclone upload failed: {up.stderr[-400:]}", file=sys.stderr)
        return None
    pub_base = os.environ.get("DISPATCH_PUBLIC_BASE")
    if pub_base:
        return f"{pub_base.rstrip('/')}/{name}"
    ln = sh(["rclone", "link", dest])
    if ln.returncode != 0:
        print(f"rclone link failed: {ln.stderr[-400:]}", file=sys.stderr)
        return None
    return to_direct(ln.stdout.strip())

def upload_git(filepath, name):
    """Push file to dispatch-media branch; return raw.githubusercontent.com URL."""
    filepath = Path(filepath).resolve()
    size_mb = filepath.stat().st_size / 1024 / 1024
    if size_mb >= 98:
        print(f"File {size_mb:.1f}MB >= 98MB git limit; git upload skipped.", file=sys.stderr)
        return None

    with tempfile.TemporaryDirectory() as tmp:
        # Clone just the dispatch-media branch (shallow) or create it fresh
        remote_url = sh(["git", "-C", str(REPO_ROOT), "remote", "get-url", "origin"]).stdout.strip()
        clone = sh(["git", "clone", "--depth=1", "--branch", MEDIA_BRANCH, remote_url, tmp])
        if clone.returncode != 0:
            # Branch doesn't exist — create it as an orphan
            sh(["git", "clone", "--depth=1", remote_url, tmp])
            sh(["git", "-C", tmp, "checkout", "--orphan", MEDIA_BRANCH])
            sh(["git", "-C", tmp, "rm", "-rf", "."])

        dest = os.path.join(tmp, name)
        import shutil; shutil.copy2(filepath, dest)
        sh(["git", "-C", tmp, "add", name])
        sh(["git", "-C", tmp, "config", "user.email", "dispatch@alaska-ai-weekly"])
        sh(["git", "-C", tmp, "config", "user.name", "Alaska.Ai Dispatch"])
        commit = sh(["git", "-C", tmp, "commit", "-m", f"add {name}"])
        if commit.returncode != 0 and "nothing to commit" not in commit.stdout + commit.stderr:
            print(f"git commit failed: {commit.stderr[-400:]}", file=sys.stderr)
            return None
        push = sh(["git", "-C", tmp, "push", "-u", "origin", MEDIA_BRANCH])
        if push.returncode != 0:
            print(f"git push to dispatch-media failed: {push.stderr[-600:]}", file=sys.stderr)
            return None

    url = f"https://github.com/{GITHUB_OWNER}/{GITHUB_REPO}/raw/{MEDIA_BRANCH}/{name}"
    print(f"HOST=permanent (dispatch-media branch)", file=sys.stderr)
    return url

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", required=True)
    ap.add_argument("--name", default=None)
    args = ap.parse_args()
    name = args.name or os.path.basename(args.file)

    # Try rclone first, fall back to git
    url = None
    if os.environ.get("RCLONE_CONFIG_B64") or os.environ.get("RCLONE_CONFIG"):
        url = upload_rclone(args.file, name)
    if url is None:
        print("rclone not configured — falling back to dispatch-media git branch", file=sys.stderr)
        url = upload_git(args.file, name)
    if url is None:
        print("ERROR: all upload methods failed", file=sys.stderr); sys.exit(1)

    # Verify HTTP 200
    try:
        import urllib.request
        code = urllib.request.urlopen(url, timeout=15).getcode()
        if code != 200:
            print(f"WARNING: URL returned HTTP {code}", file=sys.stderr)
        else:
            print(f"verified HTTP 200", file=sys.stderr)
    except Exception as e:
        print(f"WARNING: could not verify URL ({e})", file=sys.stderr)

    print(url)  # LAST stdout line = the URL

if __name__ == "__main__":
    main()
