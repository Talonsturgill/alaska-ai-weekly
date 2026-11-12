#!/usr/bin/env python3
"""Bring vo_direction.json back in line with the checked script, keeping each line's tags.

WHY (machine pass 2026-11-12, queue item vo-plan-text-drift, repeat 1). The words the voice reads
live in three places: vo_script.json (what vo_claims_check and Gate 0F checked), the plan's
`lines[]` and the plan's `assembled_prompt`, whose transcript is what Gemini actually receives. A
script edit after the vo-director ran had to be hand-copied into both plan fields, and on 11-12
vo_synth_gemini refused three times (`VO CLAIM PRECHECK`) because a plan line or the prompt's
transcript still carried the old words around an inline tag. vo_synth already rebuilt `lines[]`
from the script, but it dropped every tag on an edited line and never touched the prompt's
transcript, so the refusal stood.

This does the copy mechanically. The checked script is the source of truth for the WORDS. For each
script line:
  - a plan line whose spoken text (tags stripped) is unchanged is kept as it is, tags and all;
  - an edited line keeps the direction fields of the plan line at the same index, and each inline
    tag moves to the same word in the new text when that word survived the edit (difflib alignment
    over the words), else it is dropped and named, because an unvetted tag position can be read
    aloud;
  - the prompt's transcript is rewritten from the synced lines, keeping the prompt's own version of
    any line whose spoken words did not change. The notes above `Transcript:` are never touched.

vo_script.txt is NOT written: the editor's Gate 0F stamp is dated against it. When it disagrees with
vo_script.json the check fails and says so.

    python3 scripts/vo_plan_sync.py            # rewrite out/dispatch/vo_direction.json in place
    python3 scripts/vo_plan_sync.py --check    # exit 1 if the plan would change, write nothing
    python3 scripts/vo_plan_sync.py --self-test
vo_synth_gemini.py calls sync_lines and sync_prompt itself before its precheck.
"""
import difflib
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "out", "dispatch")
DELIM = "\nTranscript:\n"
TAG = re.compile(r"\[[^\]]*\]")


def strip_tags(s):
    return re.sub(r"\s+", " ", TAG.sub("", s)).strip()


def _norm(w):
    return re.sub(r"[^a-z0-9']", "", w.lower())


def transplant(old_text, new_text):
    """(new text carrying old_text's tags where their word survived, [dropped tags])."""
    tags_before, words = [], []   # tags_before[k]: tags sitting before old word k (k == len: at the end)
    pending = []
    for tok in re.split(r"(\[[^\]]*\])|\s+", old_text):
        if not tok:
            continue
        if TAG.fullmatch(tok):
            pending.append(tok)
        else:
            tags_before.append(pending)
            words.append(tok)
            pending = []
    tail = pending
    new_words = strip_tags(new_text).split()
    sm = difflib.SequenceMatcher(a=[_norm(w) for w in words], b=[_norm(w) for w in new_words], autojunk=False)
    where = {}
    for a, b, size in sm.get_matching_blocks():
        for d in range(size):
            where[a + d] = b + d
    placed, dropped = {}, []
    for k, tags in enumerate(tags_before):
        if not tags:
            continue
        if k in where:
            placed.setdefault(where[k], []).extend(tags)
        else:
            dropped.extend(tags)
    out = []
    for j, w in enumerate(new_words):
        out.extend(placed.get(j, []))
        out.append(w)
    if tail and words and (len(words) - 1) in where and where[len(words) - 1] == len(new_words) - 1:
        out.extend(tail)
    else:
        dropped.extend(tail)
    return " ".join(out), dropped


def sync_lines(plan_lines, script_lines):
    """(synced plan lines, notes) for the checked script's spoken lines."""
    by_text = {strip_tags(l.get("text", "")): l for l in plan_lines}
    out, notes = [], []
    for i, want in enumerate(script_lines):
        if want in by_text:
            out.append(dict(by_text[want], idx=i))
            continue
        base = plan_lines[i] if i < len(plan_lines) else {"intent": "", "emphasis": "", "energy": 3, "tags": []}
        text, dropped = transplant(base.get("text", ""), want) if i < len(plan_lines) else (want, [])
        line = dict(base, idx=i, text=text, tags=TAG.findall(text))
        out.append(line)
        notes.append(f"line {i} re-synced to the script"
                     + (f", dropped {', '.join(dropped)} (its word changed)" if dropped else ""))
    if len(plan_lines) > len(script_lines):
        notes.append(f"{len(plan_lines) - len(script_lines)} plan line(s) past the script's end removed")
    return out, notes


def sync_prompt(prompt, plan_lines):
    """(prompt whose transcript reads the plan lines, note or None). The notes above the delimiter
    stay; a transcript line whose spoken words match keeps the prompt's own tags."""
    if DELIM not in prompt:
        return prompt, None   # vo_synth's repair_prompt rebuilds a prompt with no delimiter
    head, body = prompt.split(DELIM, 1)
    sent = [ln for ln in body.splitlines() if strip_tags(ln)]
    want = [strip_tags(l["text"]) for l in plan_lines]
    if [strip_tags(ln) for ln in sent] == want:
        return prompt, None
    mine = {strip_tags(ln): ln for ln in sent}
    lines = [mine.get(w, l["text"]) for w, l in zip(want, plan_lines)]
    return head + DELIM + "\n".join(lines), "the prompt's transcript was rewritten from the synced plan lines"


def script_lines(out_dir):
    with open(os.path.join(out_dir, "vo_script.json")) as f:
        return [strip_tags(l["text"]) for l in json.load(f)["lines"]]


def run(out_dir, check):
    plan_path = os.path.join(out_dir, "vo_direction.json")
    with open(plan_path) as f:
        plan = json.load(f)
    want = script_lines(out_dir)
    problems = []
    txt = os.path.join(out_dir, "vo_script.txt")
    if os.path.exists(txt):
        have = [l.strip() for l in open(txt).read().split("\n") if l.strip()]
        if have != want:
            problems.append("vo_script.txt and vo_script.json disagree; fix the script itself (the editor's "
                            "Gate 0F stamp is dated against vo_script.txt), this tool syncs only the plan")
    lines, notes = sync_lines(plan.get("lines") or [], want)
    prompt, pnote = sync_prompt(plan.get("assembled_prompt") or "", lines)
    if pnote:
        notes.append(pnote)
    changed = lines != plan.get("lines") or prompt != plan.get("assembled_prompt")
    for n in notes:
        print(("  would: " if check else "  synced: ") + n)
    for p in problems:
        print("FAIL [vo_plan_sync] " + p)
    if check:
        print("vo_plan_sync --check: " + ("plan is stale" if changed else "plan matches the script")
              + (", script files disagree" if problems else ""))
        return 1 if changed or problems else 0
    if changed:
        plan["lines"], plan["assembled_prompt"] = lines, prompt
        with open(plan_path, "w") as f:
            json.dump(plan, f, indent=1, ensure_ascii=False)
            f.write("\n")
    print(f"vo_plan_sync: {len(lines)} lines, " + ("rewritten" if changed else "already in sync"))
    return 1 if problems else 0


def self_test():
    import tempfile
    ok = True

    def expect(name, cond):
        nonlocal ok
        print(("  ok   " if cond else "  FAIL ") + name)
        ok = ok and cond

    t, d = transplant("Alaska approved a lease, and [curious] the notice never uses one word.",
                      "Alaska just approved a fifty year lease, and the notice never uses one word.")
    expect("a tag moves with its word through an edit", t ==
           "Alaska just approved a fifty year lease, and [curious] the notice never uses one word." and d == [])
    t, d = transplant("So the argument is land, and [slow] the lease runs fifty.", "So the argument is land and gas.")
    expect("a tag whose word was cut is dropped and named", "[slow]" not in t and d == ["[slow]"])
    t, _ = transplant("[short pause] Here's the real tension.", "Here's the real tension, now.")
    expect("a leading tag stays leading", t.startswith("[short pause] Here's"))
    plan = [{"idx": 0, "text": "One [short pause] two three.", "energy": 4, "tags": ["[short pause]"]},
            {"idx": 1, "text": "Four five six.", "energy": 2, "tags": []}]
    lines, notes = sync_lines(plan, ["One two three, and four.", "Four five six."])
    expect("an edited line keeps its direction and its tag",
           lines[0]["energy"] == 4 and lines[0]["text"] == "One [short pause] two three, and four."
           and lines[0]["tags"] == ["[short pause]"] and len(notes) == 1)
    expect("an unchanged line is kept as it was", lines[1] == plan[1])
    prompt = "Read ONLY.\n# AUDIO PROFILE: x\nPace: y\nTranscript:\nOne [short pause] two three.\nFour [slow] five six."
    p2, note = sync_prompt(prompt, lines)
    expect("the prompt transcript is rewritten, notes untouched, a matching line keeps its own tag",
           note and p2.startswith("Read ONLY.\n# AUDIO PROFILE: x\nPace: y\nTranscript:\n")
           and p2.endswith("One [short pause] two three, and four.\nFour [slow] five six."))
    expect("a prompt already in sync is left alone", sync_prompt(p2, lines) == (p2, None))
    with tempfile.TemporaryDirectory() as td:
        json.dump({"lines": [{"idx": 0, "text": "One two three, and four."},
                             {"idx": 1, "text": "Four five six."}]}, open(os.path.join(td, "vo_script.json"), "w"))
        open(os.path.join(td, "vo_script.txt"), "w").write("One two three, and four.\nFour five six.\n")
        json.dump({"lines": plan, "assembled_prompt": prompt}, open(os.path.join(td, "vo_direction.json"), "w"))
        expect("--check sees the stale plan", run(td, check=True) == 1)
        expect("a sync writes it", run(td, check=False) == 0)
        expect("and --check then passes", run(td, check=True) == 0)
        open(os.path.join(td, "vo_script.txt"), "w").write("Something else.\n")
        expect("a script txt that disagrees with the json fails", run(td, check=True) == 1)
    print("vo_plan_sync self-test: " + ("PASS" if ok else "FAIL"))
    return 0 if ok else 1


if __name__ == "__main__":
    if "--self-test" in sys.argv:
        sys.exit(self_test())
    sys.exit(run(OUT, check="--check" in sys.argv))
