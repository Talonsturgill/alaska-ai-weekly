# THE WEEKLY MACHINE PASS — brief for the `machine-engineer` agent

Phase 9 of `prompts/dispatch_routine.md` spawns you once a week, after that run's film is
delivered and merged. The owner moved machine upgrades out of every run on 2026-09-30 ("machine
upgrades weekly instead of every run"), so each Dispatch now fixes only what its own film needs and
queues the rest in `docs/MACHINE_QUEUE.md`. You work that queue in your own fresh context. Do NOT
launch or spawn any subagents; do the work yourself and return your result.

The point of the machine is that the NEXT film comes out better from its first render, so the
panel stops paying to rediscover the same defects. A fix that makes a gate quieter without making a
film better is not a fix.

## Inputs

- `out/dispatch/week_digest.md`, written by `scripts/week_digest.py` from the git history of the
  panel's verdicts and judge cards over the last 14 days: which axis each judge scored lowest,
  counted, the axes the verdict notes name, and every concrete defect and hard blocker verbatim. The
  owner wants each pass "based on the recurring themes that it saw during the week ... based on
  actual output" (2026-10-02), so **the most recurring axis and defects come first**, ahead of the
  queue, and a pass with an empty queue still has this to work.
- `docs/MACHINE_QUEUE.md`, the open items. Repeat offenders (`repeat: 2` or more) first, then
  oldest first.
- `docs/EVAL_REPEAT_OFFENDERS.md` and `config/eval_ledger.yaml`, for signatures that recur. The
  ledger's last entry is 2026-09-03, so the digest is the current record.
- The newest entries of `docs/RUN_UPGRADES.md`, by `tail` or `grep` only. It is 285 KB and you do
  not need the rest.
- `docs/UPGRADE_BACKLOG.md` lists the large initiatives. Take one of those only when it is small
  enough to make and verify in this pass.

## How to work an item

1. Reproduce it first. Run the gate, read the code, probe the frame. A fix for a defect you have
   not seen is a guess.
2. Fix the ROOT CAUSE. Prefer an enforced fix, a check the pipeline runs, over a doctrine line a run
   has to remember (`scripts/run_guard.py` is the template). When the fix is doctrine, put it where
   the builder reads it: `docs/craft/DISPATCH_STANDARD.md` or the runbook.
3. Verify it before committing: `video-engine/node_modules/.bin/tsc --noEmit -p
   video-engine/tsconfig.json` for any engine change, the gate's own `--self-test` where it has one,
   the gate run against the most recent shipped film's data, and for anything that changes a frame
   `scripts/probe_frames.sh <that film's Comp> <times>` with the strip read at real scale. An
   unverified engine change can break every future run.
4. Commit each item separately: `machine(<date>): <what changed and why>`. No assistant attribution
   of any kind (CLAUDE.md).
5. Mark it in the queue: `[x]` and ` | shipped <date> <commit>`. An item you can't fix safely in this
   pass stays open with ` | escalated <date>: <why>`, and a repeat offender escalated twice goes in
   the owner's email in plain words.

At most five items per pass, and at most ONE engine system advance (a new capability in `lib/`,
registered in `video-engine/src/lib/ASSET_MANIFEST.md` with `python3 scripts/asset_index.py` rerun,
with a look-dev or probe strip as its proof). The per-run craft advance moved here.

## What you may not touch

- The bar (`rubric.ship_threshold` in `config/dispatch_rubric.yaml`), `config/owner_release.json`,
  `scripts/ship_gate.py`'s hash binding and its lack of an override flag, `scripts/no_exit.py`, and
  the panel protocol's independence rules. Those belong to the owner.
- A gate's threshold, to make it pass. Fix what it measures or fix how it measures, never the bar.
- A shipped film. Historical episodes stay as they are, and a shared `lib/` change must still
  typecheck every registered episode.
- The fact-check, dedupe and cultural rules.

## Return (strict JSON, nothing else)

```json
{
  "fixed": [{"item": "<signature>", "files": ["..."], "commit": "<sha>",
             "verify": ["<exact command the orchestrator reruns>"]}],
  "escalated": [{"item": "<signature>", "why": "..."}],
  "engine_advance": {"what": "...", "files": ["..."], "commit": "<sha>", "verify": ["..."]},
  "email_lines": ["<one line per shipped change, for the owner>"]
}
```

`engine_advance` is null when there was none. The orchestrator reruns every `verify` command and
reverts anything that fails, so list commands that prove the change, not commands that merely run.
