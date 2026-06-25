"""Upload the finished Dispatch mp4 to a host and print a one-click DIRECT-download URL.

Token-safe by design: the bytes go over the network from the container via rclone;
they NEVER pass through the model as base64. The routine calls this, captures the
printed URL (last stdout line), and passes it to scripts/dispatch_email.py --video-url.

Host-agnostic via rclone (one tool for Drive, S3, R2, Dropbox, ...). Configure ONE
remote in the routine environment, then this script doesn't care which it is.

Setup (routine environment setup script + env vars):
  # install rclone in the env setup script:
  #   curl https://rclone.org/install.sh | bash      (or apt/brew)
  # provide the rclone config as a base64 env var (so no secrets in the repo):
  #   export RCLONE_CONFIG_B64=...   # base64 of a rclone.conf with a remote named "dispatch"
  # OR point RCLONE_CONFIG at a config file path.
  # Default remote name is "dispatch:" (override with DISPATCH_REMOTE).
  #
  # Google Drive (recommended): rclone config -> new remote "dispatch", type=drive,
  #   scope=drive.file; this script converts the share link to uc?export=download.
  # Cloudflare R2 / S3: type=s3 with a PUBLIC bucket; set DISPATCH_PUBLIC_BASE to the
  #   bucket's public base URL (e.g. https://pub-xxxx.r2.dev) for a clean direct link.

Usage:
  python scripts/upload_video.py --file out/dispatch/dispatch_v2.mp4 --name dispatch-2026-06-27.mp4
"""
import argparse, base64, os, subprocess, sys, tempfile, re

def sh(cmd, **kw): return subprocess.run(cmd, capture_output=True, text=True, **kw)

def ensure_config():
    b64 = os.environ.get("RCLONE_CONFIG_B64")
    if b64:
        path = os.path.join(tempfile.gettempdir(), "rclone_dispatch.conf")
        open(path, "wb").write(base64.b64decode(b64))
        os.environ["RCLONE_CONFIG"] = path
    return os.environ.get("RCLONE_CONFIG")

def to_direct(url):
    # Google Drive share link -> direct download
    m = re.search(r"/d/([A-Za-z0-9_-]+)", url) or re.search(r"[?&]id=([A-Za-z0-9_-]+)", url)
    if "drive.google.com" in url and m:
        return f"https://drive.google.com/uc?export=download&id={m.group(1)}"
    return url

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", required=True)
    ap.add_argument("--name", default=None, help="destination filename")
    args = ap.parse_args()
    if sh(["which", "rclone"]).returncode != 0:
        print("ERROR: rclone not installed. Add `curl https://rclone.org/install.sh | bash` to the "
              "routine environment setup script.", file=sys.stderr); sys.exit(2)
    ensure_config()
    remote = os.environ.get("DISPATCH_REMOTE", "dispatch:")
    name = args.name or os.path.basename(args.file)
    dest = f"{remote}{name}"
    up = sh(["rclone", "copyto", args.file, dest, "--no-traverse"])
    if up.returncode != 0:
        print("ERROR: rclone upload failed:\n" + up.stderr[-600:], file=sys.stderr); sys.exit(1)
    pub_base = os.environ.get("DISPATCH_PUBLIC_BASE")
    if pub_base:                                   # public S3/R2 bucket
        url = f"{pub_base.rstrip('/')}/{name}"
    else:                                          # ask the backend for a share link
        ln = sh(["rclone", "link", dest])
        if ln.returncode != 0:
            print("ERROR: rclone link failed:\n" + ln.stderr[-600:], file=sys.stderr); sys.exit(1)
        url = to_direct(ln.stdout.strip())
    print(url)                                     # LAST line = the URL the routine captures

if __name__ == "__main__":
    main()
