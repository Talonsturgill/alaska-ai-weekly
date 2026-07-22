#!/usr/bin/env python3
"""Publish this run's Dispatch video into the alaskaaihq.com /videos feed.

The site (Talonsturgill/alaskaaicarousels, GitHub Pages from docs/ on main) has a
TikTok-style vertical feed at /videos driven by docs/videos/videos.json. This script
prepends the new run's entry to that manifest and pushes it to main, so the site
feed updates the same day the video ships. Idempotent: re-running with the same
--id replaces the existing entry in place instead of duplicating it.

Called by the dispatch routine in Phase 7 (after upload_video.py verifies the
permanent 9:16/poster links, since those exact URLs go into the manifest):

  python3 scripts/publish_feed.py \
    --id 2026-07-22-checkpoint-lever \
    --date 2026-07-22 \
    --title "The Checkpoint Lever" \
    --caption "The Air Force offered 4,700 acres ... still open." \
    --video-url  "https://raw.githubusercontent.com/.../dispatch_2026-07-22_9x16.mp4" \
    --poster-url "https://raw.githubusercontent.com/.../dispatch_2026-07-22_poster.png"

Exit 0 = manifest updated AND pushed. Non-zero = NOT live; the routine must surface
the failure in the Gmail draft (owner may need to grant the routine environment
push access to the alaskaaicarousels repo) rather than silently skipping — the feed
staying current is part of the deliverable, but a feed-push failure must NOT roll
back or block the already-shipped video/email.
"""
import argparse, json, subprocess, sys, tempfile, time
from pathlib import Path

REPO = "https://github.com/Talonsturgill/alaskaaicarousels.git"
MANIFEST = "docs/videos/videos.json"


def run(cmd, cwd=None, ok_fail=False):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if r.returncode != 0 and not ok_fail:
        sys.exit(f"publish_feed: FAILED: {' '.join(cmd)}\n{r.stderr.strip()[:800]}")
    return r


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--id", required=True, help="unique slug, e.g. 2026-07-22-checkpoint-lever")
    ap.add_argument("--date", required=True, help="YYYY-MM-DD air date")
    ap.add_argument("--title", required=True, help="display title (short, Fraunces headline on the feed)")
    ap.add_argument("--caption", required=True, help="1-2 sentence verified summary shown under the title")
    ap.add_argument("--video-url", required=True, help="permanent 9:16 mp4 URL (upload_video.py output, verified live)")
    ap.add_argument("--poster-url", default="", help="permanent poster PNG URL (optional but strongly preferred)")
    ap.add_argument("--repo", default=REPO)
    ap.add_argument("--branch", default="main")
    a = ap.parse_args()

    with tempfile.TemporaryDirectory(prefix="feedpub_") as td:
        # shallow, blob-less clone: we only need the manifest, not site history/media
        run(["git", "clone", "--depth", "1", "--filter=blob:none", "--branch", a.branch, a.repo, td])
        mpath = Path(td) / MANIFEST
        if not mpath.exists():
            sys.exit(f"publish_feed: {MANIFEST} missing in {a.repo}@{a.branch} -- has the /videos page shipped there?")
        m = json.loads(mpath.read_text())
        vids = m.get("videos") or []

        entry = {
            "id": a.id,
            "date": a.date,
            "title": a.title,
            "caption": a.caption,
            # store absolute URLs: the page treats http(s) entries as absolute, and the
            # routine's uploader already returns full verified raw.githubusercontent URLs
            "video": a.video_url,
            "poster": a.poster_url,
        }
        vids = [v for v in vids if v.get("id") != a.id]  # idempotent replace
        vids.insert(0, entry)                             # newest first
        m["videos"] = vids
        mpath.write_text(json.dumps(m, indent=2, ensure_ascii=False) + "\n")

        run(["git", "-C", td, "add", MANIFEST])
        run(["git", "-C", td, "commit", "-m", f"feed: add {a.id} ({a.title})"])
        # network retries with backoff, per repo git policy
        for i, wait in enumerate([0, 2, 4, 8, 16]):
            if wait:
                time.sleep(wait)
            r = run(["git", "-C", td, "push", "origin", a.branch], ok_fail=True)
            if r.returncode == 0:
                print(f"publish_feed: OK -- {a.id} is live in {MANIFEST} on {a.branch}")
                return
            if "403" in (r.stderr or "") or "denied" in (r.stderr or "").lower():
                sys.exit("publish_feed: PUSH DENIED (403) -- the routine environment lacks write "
                         "access to Talonsturgill/alaskaaicarousels. Add that repo to the routine's "
                         "repo scope at claude.ai/code (environment settings), then re-run. The video "
                         "itself already shipped; only the site feed update is pending.")
        sys.exit(f"publish_feed: push failed after retries:\n{r.stderr.strip()[:800]}")


if __name__ == "__main__":
    main()
