#!/usr/bin/env python3
"""What this run cost, and where the money went.

WHY THIS EXISTS
---------------
The owner asked for the Dispatch to cost about a tenth of what it did, without losing
quality, so it can run every day. Every figure behind that plan came from reading
finished sessions from the outside after the fact. No run recorded its own cost, so no
run could tell whether a change had saved anything, and a saving nobody measures stays a
claim.

Claude Code already keeps the numbers. The session transcript holds one entry per API
call with the model and token usage, and subagents write their own transcripts beside it.
This script prices every one of those calls and splits them by phase and by agent. It
never estimates.

WHAT THE TRANSCRIPTS DO NOT HOLD, measured on 2026-09-30 rather than assumed. Claude Code
makes calls of its own that no transcript records: the compaction summary, the permission
classifier (Sonnet 5, about 47K tokens a check, when auto mode is on) and the summaries
behind WebFetch. Its `cost-state` entry does count them, and it is written only when a
turn ends. A routine run is one long turn, so while the run is still going the transcript
figure is the whole of what can be known, and the report says so rather than guessing the
rest. The session's final total is read afterwards with get_session, using the session id
the report records, and prompts/machine_weekly.md does that for the week's runs. When a
`cost-state` total does exist, the report leads with it and shows the difference as calls
Claude Code made itself, and a model whose transcript price comes out ABOVE the CLI's own
figure means a wrong row in the price table.

USAGE
-----
  python3 scripts/run_cost.py phase research      # at the start of each phase
  python3 scripts/run_cost.py report --run-id 2026-10-03
      writes runs/<run-id>/cost.json and out/dispatch/cost_line.txt, the one line the
      email carries (dispatch_email.py --cost-json runs/<run-id>/cost.json)
  python3 scripts/run_cost.py --self-test

Phase marks go to out/dispatch/cost_phases.jsonl. A mark older than the run stamp belongs
to an earlier run, so the file starts over when the stamp is newer. A call belongs to the
last phase marked at or before it.

PRICES
------
Dollars per million tokens, from Anthropic's pricing page, read 2026-09-30. Subagents
write their cache with a 5 minute lifetime and the main loop with 1 hour, and the two are
priced differently, so the transcript's own split is used. The self-test holds the Opus
5.5, Sonnet 5 and Haiku 4.5 rows to the CLI's own dollar figures for real token totals,
to the cent. Sonnet 5's row was not on the page and is the one that reproduces the CLI's
figure. Opus 5 and Sonnet 5.5 are the page's rows and have no CLI figure to hold them to.
"""
import argparse
import datetime as dt
import glob
import json
import os
import sys
import tempfile
from collections import defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
PHASES_REL = "out/dispatch/cost_phases.jsonl"
STAMP_REL = "out/dispatch/.run_stamp.json"
LINE_REL = "out/dispatch/cost_line.txt"

# model id prefix: (input, cache write 5m, cache write 1h, cache read, output), $/MTok
PRICES = {
    "claude-opus-5-5": (4.0, 5.0, 8.0, 0.20, 20.0),
    "claude-opus-5": (5.0, 6.25, 10.0, 0.50, 25.0),
    "claude-sonnet-5-5": (2.0, 2.5, 4.0, 0.20, 10.0),
    "claude-sonnet-5": (2.0, 2.5, 4.0, 0.20, 10.0),
    "claude-haiku-4-5": (1.0, 1.25, 2.0, 0.10, 5.0),
}
WEB_SEARCH_USD = 0.01  # $10 per 1,000 searches


def price_row(model):
    for prefix in sorted(PRICES, key=len, reverse=True):
        if (model or "").startswith(prefix):
            return PRICES[prefix]
    return None


def utc(ts):
    return dt.datetime.fromisoformat(ts.replace("Z", "+00:00")).timestamp()


def call_usage(entry):
    """Token counts for one assistant entry, with the cache write split by lifetime."""
    u = entry["message"]["usage"]
    split = u.get("cache_creation") or {}
    w1h = int(split.get("ephemeral_1h_input_tokens") or 0)
    w5m = int(split.get("ephemeral_5m_input_tokens") or 0)
    total_w = int(u.get("cache_creation_input_tokens") or 0)
    if w1h + w5m != total_w:  # an older CLI that does not split: bill as 5m, flagged
        w5m, w1h = total_w - w1h, w1h
    return {
        "input": int(u.get("input_tokens") or 0),
        "write_5m": w5m,
        "write_1h": w1h,
        "read": int(u.get("cache_read_input_tokens") or 0),
        "output": int(u.get("output_tokens") or 0),
        "thinking": int((u.get("output_tokens_details") or {}).get("thinking_tokens") or 0),
        "web_search": int((u.get("server_tool_use") or {}).get("web_search_requests") or 0),
    }


def usd(model, t):
    row = price_row(model)
    if row is None:
        return None
    pi, p5, p1, pr, po = row
    return (t["input"] * pi + t["write_5m"] * p5 + t["write_1h"] * p1 + t["read"] * pr
            + t["output"] * po) / 1e6 + t["web_search"] * WEB_SEARCH_USD


def read_calls(path, agent):
    """One record per API call. A response is written once per content block, all with the
    same message id, so the entry with the most output tokens stands for the call."""
    calls, compactions, cost_state = {}, [], None
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            try:
                e = json.loads(line)
            except ValueError:
                continue
            kind = e.get("type")
            if kind == "cost-state":
                cost_state = e
            elif kind == "system" and e.get("subtype") == "compact_boundary":
                meta = e.get("compactMetadata") or {}
                compactions.append({"at": e.get("timestamp"), "pre_tokens": meta.get("preTokens"),
                                    "post_tokens": meta.get("postTokens"),
                                    "trigger": meta.get("trigger")})
            elif kind == "assistant" and isinstance(e.get("message"), dict) \
                    and e["message"].get("usage") and e.get("timestamp") \
                    and e["message"].get("model") != "<synthetic>":
                key = e["message"].get("id") or e.get("requestId") or e.get("uuid")
                t = call_usage(e)
                if key in calls and calls[key]["tokens"]["output"] >= t["output"]:
                    continue
                calls[key] = {"t": utc(e["timestamp"]), "model": e["message"].get("model"),
                              "tokens": t, "agent": agent}
    return list(calls.values()), compactions, cost_state


def find_transcript(session_id=None):
    sid = session_id or os.environ.get("CLAUDE_CODE_SESSION_ID")
    root = Path.home() / ".claude" / "projects"
    if sid:
        hits = glob.glob(str(root / "*" / f"{sid}.jsonl"))
        if hits:
            return Path(max(hits, key=os.path.getmtime))
    hits = glob.glob(str(root / "*" / "*.jsonl"))
    return Path(max(hits, key=os.path.getmtime)) if hits else None


def load_session(transcript):
    """Main loop plus every subagent the session spawned."""
    calls, compactions, cost_state = read_calls(transcript, "main")
    sub_dir = transcript.with_suffix("") / "subagents"
    spawns = defaultdict(int)
    for path in sorted(sub_dir.glob("agent-*.jsonl")) if sub_dir.is_dir() else []:
        agent = "subagent"
        meta = path.with_suffix(".meta.json")
        try:
            agent = json.loads(meta.read_text()).get("agentType") or agent
        except (OSError, ValueError):
            pass
        spawns[agent] += 1
        sub_calls, _, _ = read_calls(path, agent)
        calls += sub_calls
    return calls, compactions, cost_state, dict(spawns)


def read_phases(root):
    path = root / PHASES_REL
    marks = []
    if path.exists():
        for line in path.read_text().splitlines():
            try:
                marks.append(json.loads(line))
            except ValueError:
                pass
    return sorted(marks, key=lambda m: m["t"])


def stamp_time(root):
    try:
        return (root / STAMP_REL).stat().st_mtime
    except OSError:
        return None


def mark_phase(name, root=REPO, now=None):
    path = root / PHASES_REL
    path.parent.mkdir(parents=True, exist_ok=True)
    now = now if now is not None else dt.datetime.now(dt.timezone.utc).timestamp()
    marks = read_phases(root)
    started = stamp_time(root)
    if marks and started is not None and marks[0]["t"] < started - 5:
        marks = []  # the marks belong to an earlier run
    marks.append({"phase": name, "t": now,
                  "at": dt.datetime.fromtimestamp(now, dt.timezone.utc).isoformat(timespec="seconds")})
    path.write_text("".join(json.dumps(m) + "\n" for m in marks))
    return marks


def summarise(calls, compactions, cost_state, spawns, marks):
    by_model, by_phase, by_agent = {}, {}, {}
    unknown = set()
    fields = ("input", "write_5m", "write_1h", "read", "output", "thinking", "web_search")
    for c in sorted(calls, key=lambda c: c["t"]):
        phase = "before first phase"
        for m in marks:
            if m["t"] <= c["t"]:
                phase = m["phase"]
        cost = usd(c["model"], c["tokens"])
        if cost is None:
            unknown.add(c["model"])
            cost = 0.0
        for table, key in ((by_model, c["model"]), (by_phase, phase), (by_agent, c["agent"])):
            row = table.setdefault(key, {"calls": 0, "usd": 0.0, **{f: 0 for f in fields}})
            row["calls"] += 1
            row["usd"] += cost
            for f in fields:
                row[f] += c["tokens"][f]
    main = [c for c in calls if c["agent"] == "main"]
    ctx = [c["tokens"]["input"] + c["tokens"]["read"] + c["tokens"]["write_5m"]
           + c["tokens"]["write_1h"] for c in main]
    computed = sum(r["usd"] for r in by_model.values())
    cli_total = cost_state.get("totalCostUSD") if cost_state else None
    overpriced = []
    for model, cli in ((cost_state or {}).get("modelUsage") or {}).items():
        mine = by_model.get(model, {}).get("usd", 0.0)
        if mine - cli.get("costUSD", 0.0) > max(0.5, 0.01 * cli.get("costUSD", 0.0)):
            overpriced.append(model)
    for table in (by_model, by_phase, by_agent):
        for row in table.values():
            row["usd"] = round(row["usd"], 2)
    for agent, n in spawns.items():
        by_agent.setdefault(agent, {"calls": 0, "usd": 0.0})["spawns"] = n
    return {
        "transcript_usd": round(computed, 2),
        "cli_total_usd": round(cli_total, 2) if cli_total is not None else None,
        "outside_transcripts_usd": round(cli_total - computed, 2) if cli_total is not None else None,
        "price_rows_to_check": sorted(overpriced),
        "unpriced_models": sorted(m for m in unknown if m),
        "calls": len(calls),
        "main_context": {"peak": max(ctx) if ctx else 0,
                         "mean": round(sum(ctx) / len(ctx)) if ctx else 0,
                         "compactions": compactions},
        "by_phase": by_phase, "by_agent": by_agent, "by_model": by_model,
        "phase_marks": marks,
    }


def money(x):
    return f"${x:,.2f}"


def cost_line(report):
    """A few sentences for the email. No colons or semicolons, the email's copy gate reads it."""
    main = report["by_agent"].get("main", {}).get("usd", 0.0)
    subs = round(sum(r["usd"] for a, r in report["by_agent"].items() if a != "main"), 2)
    phases = sorted(((r["usd"], p) for p, r in report["by_phase"].items()), reverse=True)[:3]
    ctx = report["main_context"]
    n = len(ctx["compactions"])
    if report["cli_total_usd"] is not None:
        parts = [f"This session cost {money(report['cli_total_usd'])} by Claude Code's own count. "
                 f"The transcripts account for {money(report['transcript_usd'])}, "
                 f"{money(main)} in the main loop and {money(subs)} in subagents."]
    else:
        parts = [f"The calls in this run's transcripts cost {money(report['transcript_usd'])} up to "
                 f"this report, {money(main)} in the main loop and {money(subs)} in subagents. "
                 "Claude Code's own compaction and permission calls are not in them and are "
                 "counted in the session total."]
    if phases:
        parts.append("Costliest phases were " + ", ".join(f"{p} at {money(u)}" for u, p in phases) + ".")
    parts.append(f"The main context peaked at {ctx['peak'] // 1000}K tokens with "
                 f"{n} compaction{'s' if n != 1 else ''}.")
    if report["price_rows_to_check"] or report["unpriced_models"]:
        parts.append("A price row needs checking for " + ", ".join(
            report["price_rows_to_check"] + report["unpriced_models"]) + ".")
    return " ".join(parts)


def report(run_id, root=REPO, transcript=None, out=None):
    transcript = Path(transcript) if transcript else find_transcript()
    if not transcript or not transcript.exists():
        sys.exit("run_cost: no session transcript found under ~/.claude/projects")
    calls, compactions, cost_state, spawns = load_session(transcript)
    rep = summarise(calls, compactions, cost_state, spawns, read_phases(root))
    remote = os.environ.get("CLAUDE_CODE_REMOTE_SESSION_ID", "")
    rep.update({"run_id": run_id, "session": transcript.stem,
                "remote_session": ("session_" + remote.split("_", 1)[1]) if "_" in remote else None,
                "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")})
    rep["line"] = cost_line(rep)
    out = Path(out) if out else root / "runs" / run_id / "cost.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(rep, indent=1) + "\n")
    (root / LINE_REL).parent.mkdir(parents=True, exist_ok=True)
    (root / LINE_REL).write_text(rep["line"] + "\n")
    print(rep["line"])
    print("wrote", out)
    return rep


def self_test():
    scratch = REPO / "out" / "tmp"
    scratch.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=scratch) as tmp:
        root = Path(tmp)
        sess = root / "proj" / "s1.jsonl"
        (root / "proj" / "s1" / "subagents").mkdir(parents=True)
        (root / "out" / "dispatch").mkdir(parents=True)
        (root / STAMP_REL).write_text("{}")
        os.utime(root / STAMP_REL, (1000.0, 1000.0))

        def call(mid, ts, model, inp, w5, w1, rd, out, side=False):
            usage = {"input_tokens": inp, "cache_creation_input_tokens": w5 + w1,
                     "cache_read_input_tokens": rd, "output_tokens": out,
                     "cache_creation": {"ephemeral_5m_input_tokens": w5, "ephemeral_1h_input_tokens": w1}}
            iso = dt.datetime.fromtimestamp(ts, dt.timezone.utc).isoformat().replace("+00:00", "Z")
            return json.dumps({"type": "assistant", "timestamp": iso, "isSidechain": side,
                               "message": {"id": mid, "model": model, "usage": usage}}) + "\n"

        # m1 is written twice (two content blocks), and must be counted once
        main = (call("m1", 1100, "claude-opus-5-5", 10, 0, 1_000_000, 0, 50)
                + call("m1", 1100, "claude-opus-5-5", 10, 0, 1_000_000, 0, 100_000)
                + call("m2", 1300, "claude-opus-5-5", 0, 0, 0, 2_000_000, 0)
                + json.dumps({"type": "system", "subtype": "compact_boundary", "timestamp": "x",
                              "compactMetadata": {"preTokens": 250000, "postTokens": 12000,
                                                  "trigger": "auto"}}) + "\n")
        sub = call("s1", 1250, "claude-haiku-4-5-20251001", 1_000_000, 1_000_000, 0, 0, 0, True)
        # m1 = 1M 1h write at $8 + 0.1M output at $20 = $10.00004, m2 = 2M reads at $0.20 = $0.40
        # s1 = 1M input at $1 + 1M 5m write at $1.25 = $2.25, so $12.65 in all
        synthetic = json.dumps({"type": "assistant", "timestamp": "2026-01-01T00:00:00Z", "message": {
            "id": "x", "model": "<synthetic>", "usage": {"input_tokens": 0, "output_tokens": 0}}}) + "\n"
        state = {"type": "cost-state", "totalCostUSD": 12.65, "modelUsage": {
            "claude-opus-5-5": {"costUSD": 10.4}, "claude-haiku-4-5-20251001": {"costUSD": 2.25}}}
        sess.write_text(main + synthetic + json.dumps(state) + "\n")
        (root / "proj" / "s1" / "subagents" / "agent-a1.jsonl").write_text(sub)
        (root / "proj" / "s1" / "subagents" / "agent-a1.meta.json").write_text(
            json.dumps({"agentType": "scorer"}))
        mark_phase("research", root, now=1050)
        mark_phase("cut", root, now=1200)
        rep = report("2026-01-01", root, transcript=sess, out=root / "cost.json")
        checks = [
            (rep["calls"] == 3, "a response written as two blocks counts as one call"),
            (rep["transcript_usd"] == 12.65 and rep["outside_transcripts_usd"] == 0.0
             and not rep["price_rows_to_check"], "the priced calls add up to the CLI total"),
            (rep["by_phase"]["research"]["usd"] == 10.0, "a call lands in the phase marked before it"),
            (rep["by_phase"]["cut"]["usd"] == 2.65, "later calls land in the later phase"),
            (rep["by_agent"]["scorer"]["spawns"] == 1 and rep["by_agent"]["scorer"]["usd"] == 2.25,
             "a subagent is named by its type"),
            (rep["main_context"]["peak"] == 2_000_000, "peak context counts reads and writes"),
            (len(rep["main_context"]["compactions"]) == 1, "compactions are counted"),
            (":" not in rep["line"] and ";" not in rep["line"], "the email line has no colon or semicolon"),
        ]
        os.utime(root / STAMP_REL, (5000.0, 5000.0))
        checks.append((len(mark_phase("research", root, now=5100)) == 1,
                       "marks from before the run stamp are dropped"))
        calls, comp, _, spawns = load_session(sess)
        rep2 = summarise(calls, comp, None, spawns, read_phases(root))
        checks.append((not rep2["unpriced_models"], "a synthetic entry is not a call and every model has a row"))
        checks.append((rep2["cli_total_usd"] is None and "not in them" in cost_line(rep2),
                       "mid-turn, with no CLI total yet, the line says what it leaves out"))
        low = {"type": "cost-state", "totalCostUSD": 5.0, "modelUsage": {"claude-opus-5-5": {"costUSD": 2.0}}}
        checks.append((summarise(calls, comp, low, spawns, [])["price_rows_to_check"] == ["claude-opus-5-5"],
                       "a transcript price above the CLI's own figure flags the row"))
        # every price row the CLI has a figure for must reproduce it. These are the CLI's
        # modelUsage totals from a real 2026-09 session. The Opus 5.5 total is from the end of
        # its first turn, when every cache write was the main loop's 1 hour kind, and Sonnet 5
        # and Haiku 4.5 wrote theirs at the 5 minute rate.
        for model, tok, cli in (
                ("claude-opus-5-5", dict(input=762, write_5m=0, write_1h=646572, read=62469688,
                                         output=185639, thinking=0, web_search=0), 21.382341600000004),
                ("claude-sonnet-5", dict(input=172, write_5m=1800058, write_1h=0, read=8701907,
                                         output=441511, thinking=0, web_search=0), 10.655980399999999),
                ("claude-haiku-4-5-20251001", dict(input=3424210, write_5m=202478, write_1h=0,
                                                   read=1256728, output=126543, thinking=0,
                                                   web_search=178), 6.215695300000001)):
            checks.append((abs(usd(model, tok) - cli) < 0.005, f"{model} row reproduces the CLI's figure"))
    bad = [msg for ok, msg in checks if not ok]
    for ok, msg in checks:
        print(("ok   " if ok else "FAIL ") + msg)
    if bad:
        sys.exit(1)
    print("run_cost self-test passed")


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--self-test", action="store_true")
    sub = ap.add_subparsers(dest="cmd")
    p = sub.add_parser("phase")
    p.add_argument("name")
    r = sub.add_parser("report")
    r.add_argument("--run-id", required=True)
    r.add_argument("--transcript")
    r.add_argument("--out")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    if a.cmd == "phase":
        mark_phase(a.name)
        print(f"phase {a.name} marked")
    elif a.cmd == "report":
        report(a.run_id, transcript=a.transcript, out=a.out)
    else:
        ap.print_help()


if __name__ == "__main__":
    main()
