#!/usr/bin/env python3
"""Wait for a background job inside ONE tool call, then say how it ended.

WHY THIS EXISTS (2026-09-30, the cost project)
----------------------------------------------
Every tool call re-reads the whole conversation. Late in a Dispatch run that is several
hundred thousand tokens, so a render that takes fourteen minutes and is polled every thirty
seconds costs twenty-eight full re-reads to learn one fact, that it finished. The polling
was never the work. It was the most expensive way to wait.

This blocks on the job's own completion marker for up to nine minutes, inside a single
call, and prints only what the next decision needs. Run it with the Bash tool's timeout at
600000 ms. It waits on the `.done` file scripts/run_bg.sh writes when the job exits, never
on a filename a stale artifact could satisfy, which is the 2026-08-06 lesson.

  python3 scripts/wait_for.py out/dispatch/bg cut --show out/dispatch/cut_summary.txt

EXIT CODES, so a caller never has to parse prose:
  0  the job finished and exited 0
  1  the job finished and exited non-zero (the log tail says why)
  3  still running when this call's time ran out. Call it again, nothing is wrong
  4  WEDGED. The heartbeat is stale and no .done exists, so the job died without finishing
  2  bad arguments, or no such job was ever launched
"""
import argparse
import os
import sys
import time

WEDGED_S = 90  # run_bg.sh touches the heartbeat every 15s


def tail(path, n):
    try:
        with open(path, encoding="utf-8", errors="replace") as fh:
            lines = fh.read().splitlines()
    except OSError:
        return []
    return lines[-n:]


def main(argv=None):
    ap = argparse.ArgumentParser(description="block on a run_bg.sh job for one tool call")
    ap.add_argument("marker_dir")
    ap.add_argument("name")
    ap.add_argument("--timeout", type=float, default=540.0,
                    help="seconds to wait in this call (default 540, under the 600s tool cap)")
    ap.add_argument("--tail", type=int, default=15, help="log lines to print when it ends")
    ap.add_argument("--show", default="", help="print this file instead of the log tail when it ends")
    ap.add_argument("--poll", type=float, default=5.0)
    a = ap.parse_args(argv)

    base = os.path.join(a.marker_dir, a.name)
    done, beat, log = base + ".done", base + ".heartbeat", base + ".log"
    if not os.path.exists(beat) and not os.path.exists(done):
        print(f"wait_for: no job named '{a.name}' under {a.marker_dir} (never launched?)")
        return 2
    start = time.time()
    while True:
        if os.path.exists(done):
            try:
                code = int(open(done).read().strip() or "1")
            except ValueError:
                code = 1
            print(f"wait_for: '{a.name}' finished with exit {code} "
                  f"({time.time() - start:.0f}s in this call)")
            shown = a.show and os.path.exists(a.show)
            for line in (tail(a.show, 200) if shown else tail(log, a.tail)):
                print("  " + line)
            return 0 if code == 0 else 1
        try:
            stale = time.time() - os.path.getmtime(beat)
        except OSError:
            stale = WEDGED_S + 1
        if stale > WEDGED_S:
            print(f"wait_for: '{a.name}' is WEDGED. Heartbeat {stale:.0f}s old and no .done. "
                  f"Read {log}, kill by the PID in {base}.pid, then relaunch.")
            for line in tail(log, a.tail):
                print("  " + line)
            return 4
        if time.time() - start >= a.timeout:
            last = tail(log, 1)
            print(f"wait_for: '{a.name}' still running after {a.timeout:.0f}s, heartbeat "
                  f"{stale:.0f}s old. Call again. Last log line: {last[0] if last else '(empty)'}")
            return 3
        time.sleep(a.poll)


def self_test():
    import subprocess
    import tempfile
    repo = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    scratch = os.path.join(repo, "out", "tmp")
    os.makedirs(scratch, exist_ok=True)
    runbg = os.path.join(repo, "scripts", "run_bg.sh")
    checks = []
    with tempfile.TemporaryDirectory(dir=scratch) as d:
        subprocess.run(["bash", runbg, d, "ok", "--", "bash", "-c", "echo hello; exit 0"],
                       check=True, capture_output=True)
        checks.append((main([d, "ok", "--timeout", "20", "--poll", "0.2"]) == 0, "a clean job exits 0"))
        subprocess.run(["bash", runbg, d, "bad", "--", "bash", "-c", "echo broke; exit 7"],
                       check=True, capture_output=True)
        checks.append((main([d, "bad", "--timeout", "20", "--poll", "0.2"]) == 1, "a failed job exits 1"))
        subprocess.run(["bash", runbg, d, "slow", "--", "python3", "-c", "import time; time.sleep(30)"],
                       check=True, capture_output=True)
        checks.append((main([d, "slow", "--timeout", "1", "--poll", "0.2"]) == 3,
                       "a job still running when time runs out exits 3"))
        open(os.path.join(d, "dead.heartbeat"), "w").close()
        os.utime(os.path.join(d, "dead.heartbeat"), (time.time() - 300, time.time() - 300))
        checks.append((main([d, "dead", "--timeout", "5", "--poll", "0.2"]) == 4,
                       "a stale heartbeat with no .done is wedged"))
        checks.append((main([d, "never", "--timeout", "1"]) == 2, "an unknown job exits 2"))
        pid = open(os.path.join(d, "slow.pid")).read().strip()
        subprocess.run(["pkill", "-P", pid], capture_output=True)
        subprocess.run(["kill", pid], capture_output=True)
    for ok, msg in checks:
        print(("ok   " if ok else "FAIL ") + msg)
    if not all(ok for ok, _ in checks):
        return 1
    print("wait_for self-test passed")
    return 0


if __name__ == "__main__":
    if sys.argv[1:] == ["--self-test"]:
        sys.exit(self_test())
    sys.exit(main())
