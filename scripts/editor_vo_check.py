#!/usr/bin/env python3
"""GATE 0F: the editor reads the VO script against claims.json BEFORE the first synth.

WHY THIS EXISTS (machine pass 2026-11-09; queue: editor wording check runs after the VO is
synthesized). On 11-09 the editor's first read of the narration came after the synth, at the
panel, and found five wording risks in the spoken line ("the party gets" where the claim says
requests, "searchable", a present tense, the scope of "downloads", "everything else is a yes").
Fixing them cost a full re-synth, and three more were shipped as disclosed risks rather than pay a
third. The same class bit on 10-09 (caption-vs-vo-claim-wording: "would recover" against a claim
that says "can recover") and on 11-01, where Gate 0E's cold read failed twice. Gate 0E is a NAIVE
read on purpose (the VO text only), so it can never compare wording to the evidence, and
vo_claims_check is mechanical. The editor is the only reader who does that, and it read too late.

So vo_synth_gemini.py refuses to spend a TTS call until out/dispatch/editor_vo.json exists, says
ship true, and is STAMPED with the sha256 of the vo_script.txt and claims.json it was given. Any
later edit to either changes the hash, and the synth asks for a fresh read, which is the point:
a wording fix made after the editor is a wording fix nobody checked.

  # the editor agent (no-spawn) is given vo_script.txt and claims.json and writes
  #   out/dispatch/editor_vo.json  {"ship": true|false, "findings": [{"line": n, "risk": "...", "fix": "..."}]}
  python3 scripts/editor_vo_check.py --stamp    # binds that verdict to the current script and claims
  python3 scripts/editor_vo_check.py            # exit 0 when the receipt is current, 1 otherwise
  python3 scripts/editor_vo_check.py --self-test
"""
import hashlib
import json
import os
import sys
import tempfile

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
OUT = os.path.join(REPO, "out", "dispatch")
REMEDY = ("give the editor agent vo_script.txt and claims.json (wording against each cited claim: "
          "verbs, tense, scope, absolutes), apply its fixes to the script, write its verdict to "
          "out/dispatch/editor_vo.json, then run python3 scripts/editor_vo_check.py --stamp")


def _sha(path):
    with open(path, "rb") as fh:
        return hashlib.sha256(fh.read()).hexdigest()


def stamp(out=OUT):
    rp = os.path.join(out, "editor_vo.json")
    try:
        rec = json.load(open(rp))
    except (OSError, ValueError) as exc:
        return 1, f"editor_vo_check: no editor verdict to stamp ({exc}). {REMEDY}"
    if rec.get("ship") is not True:
        n = len(rec.get("findings") or [])
        return 1, (f"editor_vo_check: the editor returned ship {rec.get('ship')!r} with {n} finding(s). "
                   "Fix the script and re-run the editor; a verdict that does not ship is never stamped")
    rec["script_sha256"] = _sha(os.path.join(out, "vo_script.txt"))
    rec["claims_sha256"] = _sha(os.path.join(out, "claims.json"))
    with open(rp, "w") as fh:
        json.dump(rec, fh, indent=1)
    return 0, f"editor_vo_check: stamped the editor's ship verdict to vo_script.txt {rec['script_sha256'][:12]}"


def check(out=OUT):
    rp = os.path.join(out, "editor_vo.json")
    try:
        rec = json.load(open(rp))
    except (OSError, ValueError):
        return 1, f"GATE 0F: no editor verdict on the VO script before the synth. {REMEDY}"
    if rec.get("ship") is not True:
        return 1, f"GATE 0F: the editor's verdict is ship {rec.get('ship')!r}. {REMEDY}"
    for name, key in (("vo_script.txt", "script_sha256"), ("claims.json", "claims_sha256")):
        p = os.path.join(out, name)
        if not os.path.exists(p):
            return 1, f"GATE 0F: {name} is missing, nothing to compare the editor's read against"
        if rec.get(key) != _sha(p):
            why = "was never stamped" if not rec.get(key) else "changed after the editor read it"
            return 1, f"GATE 0F: {name} {why}. {REMEDY}"
    return 0, f"GATE 0F: the editor's ship verdict is current for this script and claim set"


def _self_test():
    bad = []
    with tempfile.TemporaryDirectory(prefix="editor-vo-") as d:
        open(os.path.join(d, "vo_script.txt"), "w").write("Alaska's courts won't let staff transcribe hearings.\n")
        open(os.path.join(d, "claims.json"), "w").write('{"claims": []}')
        if check(d)[0] != 1:
            bad.append("no receipt should fail")
        json.dump({"ship": False, "findings": [{"line": 0, "risk": "scope"}]}, open(os.path.join(d, "editor_vo.json"), "w"))
        if stamp(d)[0] != 1:
            bad.append("a ship false verdict must not stamp")
        json.dump({"ship": True, "findings": []}, open(os.path.join(d, "editor_vo.json"), "w"))
        if check(d)[0] != 1:
            bad.append("an unstamped verdict should fail")
        if stamp(d)[0] != 0 or check(d)[0] != 0:
            bad.append("a stamped ship verdict should pass")
        open(os.path.join(d, "vo_script.txt"), "a").write("A judge opens the AI transcript.\n")
        if check(d)[0] != 1:
            bad.append("a script edit after the stamp should fail")
        stamp(d)
        open(os.path.join(d, "claims.json"), "w").write('{"claims": [{"id": "c1"}]}')
        if check(d)[0] != 1:
            bad.append("a claims edit after the stamp should fail")
    print("editor_vo_check self-test:", "FAIL " + "; ".join(bad) if bad else "PASS (6 cases)")
    return 1 if bad else 0


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    if argv[:1] == ["--self-test"]:
        return _self_test()
    code, msg = stamp() if argv[:1] == ["--stamp"] else check()
    print(msg)
    return code


if __name__ == "__main__":
    sys.exit(main())
