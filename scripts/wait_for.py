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
  4  WEDGED. The heartbeat is stale, or the job's process is gone, and no .done exists, so the
     job died without finishing. It prints the exact relaunch line run_bg.sh recorded.

VANISHED IS WEDGED, AND IS SAID AT ONCE (machine pass 2026-11-14, queue: worker-restart-kills-bg-
jobs). A session worker restart killed 11-14's running make_cut: no .done, and the next wait
learned nothing until the heartbeat went 90 s stale, then had to rebuild the launch line by hand.
run_bg.sh already detaches with setsid; what a restart that takes the container's processes leaves
is a PID that no longer exists. So a dead PID with no .done is reported on the first poll, with
the relaunch line from <name>.cmd.
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


def pid_alive(base):
    """False only when <name>.pid names a process that no longer exists."""
    try:
        pid = int(open(base + ".pid").read().strip())
    except (OSError, ValueError):
        return True
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    # A killed job whose parent never reaps it lingers as a zombie, and kill(pid, 0) still succeeds.
    try:
        stat = open("/proc/%d/stat" % pid).read()
        return stat[stat.rindex(")") + 2:].split()[0] != "Z"
    except (OSError, ValueError, IndexError):
        return True


def relaunch_hint(base):
    try:
        line = open(base + ".cmd").read().strip()
    except OSError:
        line = ""
    return f"Relaunch: {line}" if line else "Relaunch it with the same run_bg.sh line."


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
        if not pid_alive(base):
            time.sleep(0.5)   # the job writes .done just before its process exits
            if not os.path.exists(done):
                print(f"wait_for: '{a.name}' is WEDGED. Its process (PID in {base}.pid) is gone and "
                      f"there is no .done, so it was killed before finishing (a worker restart or a "
                      f"kill). Read {log}. {relaunch_hint(base)}")
                for line in tail(log, a.tail):
                    print("  " + line)
                return 4
            continue
        try:
            stale = time.time() - os.path.getmtime(beat)
        except OSError:
            stale = WEDGED_S + 1
        if stale > WEDGED_S:
            print(f"wait_for: '{a.name}' is WEDGED. Heartbeat {stale:.0f}s old and no .done. "
                  f"Read {log}, kill by the PID in {base}.pid, then relaunch. {relaunch_hint(base)}")
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
    # A killed job's heartbeat writer can race the teardown; cleanup errors are not test results.
    with tempfile.TemporaryDirectory(dir=scratch, ignore_cleanup_errors=True) as d:
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
        subprocess.run(["bash", runbg, d, "gone", "--", "python3", "-c", "import time; time.sleep(60)"],
                       check=True, capture_output=True)
        gone = open(os.path.join(d, "gone.pid")).read().strip()
        subprocess.run(["pkill", "-KILL", "-s", gone], capture_output=True)   # the whole session, as a restart does
        time.sleep(0.3)
        t0 = time.time()
        checks.append((main([d, "gone", "--timeout", "30", "--poll", "0.2"]) == 4 and time.time() - t0 < 10,
                       "a killed job with a fresh heartbeat is wedged on the first polls, not after 90 s"))
        cmd = open(os.path.join(d, "gone.cmd")).read()
        checks.append(("run_bg.sh" in cmd and " gone -- python3 -c" in cmd, "run_bg.sh records the relaunch line"))
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
