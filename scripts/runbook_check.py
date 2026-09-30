#!/usr/bin/env python3
"""Prove the lean runbook kept every rule the long master prompt carried.

WHY THIS EXISTS (2026-09-30, the cost project)
----------------------------------------------
The master prompt was 132 KB, roughly 33,000 tokens, re-read on every call of every run. It was
split: the rules stayed in `prompts/dispatch_routine.md` and the incident accounts moved, verbatim,
to `docs/DISPATCH_HISTORY.md`. A split like that fails quietly. A gate command that did not make
the cut simply stops being run, nothing errors, and the film gets worse weeks later for a reason
nobody can find.

So this reads the history and fails when anything it names is missing from the runbook: every
script, config file, doc and scratch path, every command a run is told to type, and the numbers
the rules are made of. A name that was retired on purpose is listed in RETIRED with the reason,
so dropping one is a decision someone wrote down rather than an accident. It also fails when the
runbook names a script that does not exist, which is how a typo in a gate command would ship.

  python3 scripts/runbook_check.py
"""
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
HISTORY = REPO / "docs" / "DISPATCH_HISTORY.md"
RUNBOOK = REPO / "prompts" / "dispatch_routine.md"

PATH_RE = re.compile(r"(?<![\w/.-])((?:scripts|config|docs|video-engine|\.claude|queue|out/dispatch|"
                     r"assets|archive)/[A-Za-z0-9_./*<>-]*[A-Za-z0-9_*>])")

# Named in the history and deliberately not in the runbook, each with its reason.
RETIRED = {
    "docs/RUN_UPGRADES.md": None,  # still named, kept here only as a reminder it is append-only
    "out/dispatch/frames": "named only inside the KNOWN DEAD GATE account, now a queue item",
    "out/dispatch/quality_report.json": "the retired per-frame pipeline's report",
}

# The numbers and exact strings the rules are made of. Each must survive the split.
MUST_KEEP = [
    "30 DAYS", "4.9 per 100 words", "112 to 130", "-14 LUFS", "TP <= -1.0", "median < 150ms",
    "SIM_FLOOR 0.92", "WER<=0.15", "cfg_weight stays 0.5", "at most 8 agents", "at most 20 WebSearch",
    "Use at most 20 WebSearch calls", "at most 4 researchers", "by ~1.3s", "crop=1080:1080:0:420",
    "y=420 and y=1500", "1080x1080", "1080x1920", "720x1280", "< 100 MB", "< 100 KB", ">=6dB",
    "hook <= 140 chars", "900 to 2200", "1300 to", "3 to 5 hashtags", "ship 8.5", "24 to 40 beats",
    "25 to 38s", "55 to 72s", "88 to 104s", "planted by 20s", "85s or later", "spanning >= 60s",
    "NOT within 8s", "introduced by 10s", "motion_by_s <= 1.3", "hold_s 0.4 to 0.8",
    "rubric.ship_threshold", "no-spawn", "Do NOT launch or spawn any subagents; do the work yourself "
    "and return your result.", "--hero <Asset>", "--cast", "--stance", "--angle", "--composition",
    "dispatch-<date>-<basename>", "HTTP 200", "update_draft", "DRAFT and\n  not SENT",
    "~-11 dBFS", "~-15", "~-19", "+/-0.35", "3kHz/-2.5dB", "100Hz", "crc32(DATE:idx)",
    "gemini-3.1-flash-tts-preview", "gemini-2.5-pro", "Sulafat", "SynthID", "6.5s",
    "ALASKAAIHQ.COM", "data-band=\"ok\"", "talking={useVoice().opennessAt(globalFrame)}",
    "ambientMouth()", "entrance()", "followThrough()", "ChipShadow", "`scene_start_line`",
    "1.00 to ~1.07", "~2.5x", "piece_end /\n5", "config/owner_release.json",
]

# Commands the history tells a run to type; each must appear in the runbook in the same form.
COMMANDS = [
    "python3 scripts/no_exit.py check", "python3 scripts/no_exit.py status",
    "python3 scripts/story_gate.py window", "python3 scripts/story_gate.py check",
    "python3 scripts/run_guard.py init --run-id <date>", "bash scripts/setup_env.sh",
    "python3 scripts/dedupe.py list", "python3 scripts/dedupe.py check --entities",
    "python3 scripts/storyboard_check.py", "python3 scripts/caption_band_check.py",
    "python3 scripts/staging_check.py", "python3 scripts/preflight.py",
    "python3 scripts/crop_safety.py", "python3 scripts/vo_synth_gemini.py",
    "python3 scripts/caption_check.py out/dispatch/post.txt",
    "python3 scripts/ship_gate.py record --judges <j1>,<j2>,<j3>",
    "python3 scripts/ship_gate.py check", "python3 scripts/dead_space_check.py --every 30",
    "python3 scripts/text_fit_check.py", "python3 scripts/publish_feed.py --id <run-slug>",
    "scripts/mux_and_verify.sh <silent.mp4> <master.wav> <out.mp4>",
    "git fetch origin main && git checkout -B main\n  origin/main",
    "npm config set cafile /root/.ccr/ca-bundle.crt",
    "pgrep -fa \"out/dispatch/dispatch\"",
]


def norm(s):
    return re.sub(r"\s+", " ", s).strip()


def check(hist, book):
    """Every problem with the runbook against the history's verbatim body, as a list of lines."""
    hist = hist.split("\n---\n", 1)[1] if "\n---\n" in hist else hist  # skip the new header
    flat = norm(book)
    problems = []
    for path in sorted(set(PATH_RE.findall(hist))):
        path = path.rstrip(".")
        if path in book or path in RETIRED:
            continue
        # a directory or file named by its parent path is kept if its basename is
        if Path(path).name and Path(path).name in book and "/" in path:
            continue
        problems.append(f"path dropped from the runbook: {path}")
    for s in MUST_KEEP:
        if norm(s) not in flat:
            problems.append(f"rule text dropped from the runbook: {s!r}")
    for c in COMMANDS:
        if norm(c) not in flat:
            problems.append(f"command dropped from the runbook: {c!r}")
    for script in sorted(set(re.findall(r"scripts/[A-Za-z0-9_]+\.(?:py|sh|mjs|cjs)", book))):
        if not (REPO / script).exists():
            problems.append(f"the runbook names a script that does not exist: {script}")
    return problems, len(set(PATH_RE.findall(hist)))


def self_test():
    """The check has teeth: drop a gate command, a rule number and a path, and it must say so."""
    hist, book = HISTORY.read_text(), RUNBOOK.read_text()
    base, _ = check(hist, book)
    cut = (book.replace("python3 scripts/ship_gate.py check", "python3 scripts/ship_gate.py")
               .replace("SIM_FLOOR 0.92", "SIM_FLOOR")
               .replace("docs/craft/ENGAGEMENT.md", "the engagement doc"))
    found, _ = check(hist, cut)
    typo, _ = check(hist, book + "\nrun scripts/no_such_gate.py\n")
    checks = [
        (not base, "the committed runbook passes"),
        (any("ship_gate.py check" in f for f in found), "a dropped gate command is caught"),
        (any("SIM_FLOOR 0.92" in f for f in found), "a dropped rule number is caught"),
        (any("ENGAGEMENT.md" in f for f in found), "a dropped doc path is caught"),
        (any("no_such_gate.py" in f for f in typo), "a script that does not exist is caught"),
    ]
    for ok, msg in checks:
        print(("ok   " if ok else "FAIL ") + msg)
    return 0 if all(ok for ok, _ in checks) else 1


def main():
    if sys.argv[1:] == ["--self-test"]:
        return self_test()
    hist, book = HISTORY.read_text(), RUNBOOK.read_text()
    problems, n_paths = check(hist, book)
    for p in problems:
        print("FAIL " + p)
    if problems:
        print(f"runbook_check: {len(problems)} problem(s). Put the rule back, or record why it "
              "was retired in RETIRED.")
        return 1
    print(f"runbook_check: all {n_paths} paths, {len(COMMANDS)} commands and {len(MUST_KEEP)} rule "
          f"strings from the history are in the runbook ({len(book):,} bytes against the "
          f"history's {len(hist):,})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
