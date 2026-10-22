#!/usr/bin/env python3
"""VO CLAIMS CHECK — does the NARRATION obey the fact-check-safe set?

WHY THIS EXISTS (2026-08-08).

On this run the caption scorer found a hard fail in the LinkedIn post: the copy said the
X-ray machines went to "five rural clinics that didn't have one". That is an inference.
The claim record (c4) supports only "portable X-ray machines for five rural clinics", and
claims.json explicitly bans any imaging-absence claim, because the only source for it is a
single first-person essay three years old. It was also the one invented detail attached to
an Alaska Native nonprofit, which is where the claim set is strictest.

The same sentence was in the NARRATION, and by the time the scorer found it the voice had
already been synthesized. It cost two rounds of surgical line patching to remove.

The gap is structural, not a lapse. The caption is gated by a scorer that reads claims.json.
The VO script is gated by Gate 0E, which asks whether a STRANGER CAN FOLLOW IT, and by the
soundcheck, which asks whether the ASR heard the right words. Nothing between the writers
room and the TTS ever compares the script to the EVIDENCE. So a false line can pass every
gate the pipeline has and reach synthesis.

This closes that. It is deliberately mechanical and deliberately narrow: it cannot judge
whether a sentence is true, so it checks the two things a machine CAN check.

  1. OBLIGATIONS. Every claims.json claim carries a `requires` block, written by the
     fact-checker, listing what the film must do to use it honestly. Where an obligation
     names a word the line must contain (STUDY, IN THIS ROUND, YEAR ONE, JUNE 2026...), a
     line citing that claim must contain it. Where an obligation BANS a form, the line must
     not contain it.
  2. UNSOURCED QUANTIFICATION. A line that states a number, a proportion or a superlative
     and cites NO claim id is an assertion the record has not been asked about. That is
     exactly the shape of the line that got through.

Usage:
    python3 scripts/vo_claims_check.py            # exit 1 on any violation
    python3 scripts/vo_claims_check.py --list     # print what it derived, exit 0
    python3 scripts/vo_claims_check.py --before-synth  # provisional density, no old timings

It reads the SCRIPT, so it runs BEFORE a second of TTS is spent, which is the whole point.
"""
import json, re, sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import word_ban

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, ".."))
OUT = os.path.join(REPO, "out", "dispatch")

# An obligation phrased in the fact-checker's own words maps to a token the line must
# carry. Keys are matched case-insensitively inside the `requires` text.
MUST_CONTAIN = [
    ("must be on screen and in the vo", None),      # handled by the explicit pairs below
    ("the word study must be on screen", "study"),
    ("with study on screen", "study"),
    ("in this round", "this round"),
    ("label it year one", "year one"),
    ("is labelled year one", "year one"),
    ("must appear on screen with the quote, and the vo must place her in june", "june"),
    ("the vo must place her in june", "june"),
]

# Forms a line may never take, phrased as (regex, why). These come straight out of the
# claim set's own kill list and its `requires` prohibitions.
BANNED = [
    (r"\bcannot\b", "the word 'cannot' is banned; use can't"),
    (r"[—–]", "em or en dash"),
    (r"[;:]", "semicolon or colon"),
    (r"\btribal consortium\b", "Chugachmiut may not be called a tribal consortium (unverified)"),
    (r"didn'?t have one", "an imaging-absence claim; the record does not support it"),
    (r"\blacked\b.{0,24}\b(x[- ]?ray|imaging)\b", "an imaging-absence claim"),
    (r"\bAI scheduling\b", "the scheduling system carries no technology descriptor in the source"),
    (r"\b1\.65\s*%|\b1\.65 percent", "must stay 'under two percent'; the numerator is 'over $4.5M'"),
    (r"\$?4,500,000|four million five hundred thousand", "must stay 'over four and a half million'"),
]

# A line that quantifies. Bare years and ordinal dates are not quantification.
QUANT = re.compile(
    r"\b(hundred|thousand|million|billion|percent|per cent|twice|three times|four times|"
    r"half|most|fewest|largest|smallest|only one|not one|exactly once|every|all of)\b", re.I)
MIN_CLAIMS_PER_MIN = 7.0    # a 2-minute film owes ~14 facts, not 13
MIN_CLAIM_COVERAGE = 0.70   # >=70% of what was verified must actually reach the narration
PROVISIONAL_WORDS_PER_SECOND = 2.4

DATEISH = re.compile(r"\b(august|june|july|september|friday|monday|year one)\b", re.I)

# 3. UNSOURCED CADENCE (2026-08-13). QUANT catches numbers, proportions and superlatives, and a
# RATE is none of those, so "The aim is a new one any hour" passed this gate clean while
# asserting a refresh frequency no claim in the file carries. Two judges reported it, three
# rounds apart, and the run shipped the video anyway and told the owner it "needs a single-line
# re-synth" -- i.e. handed over a knowingly wrong narration and deferred the fix. The owner's
# answer: "why would u give me a video, and say it needs a resynth, who's gonna do that?"
#
# A cadence is a factual assertion about how often something happens. It is exactly as
# load-bearing as a number and it was the one shape of claim nothing here was reading.
CADENCE = re.compile(
    r"\b(any hour|every hour|each hour|hourly|per hour|a minute|per minute|every minute|"
    r"every day|each day|daily|per day|every second|per second|continuously|"
    r"in real time|round the clock|constantly|on demand|any time)\b", re.I)


def _span_ids(lines, cid):
    """The line indices citing this claim, plus one line either side, as a string."""
    hits = [l["idx"] for l in lines if cid in (l.get("claims") or [])]
    if not hits:
        return "-"
    lo, hi = max(0, min(hits) - 1), min(len(lines) - 1, max(hits) + 1)
    return f"{lo}..{hi}"


def _claim_span(lines, cid):
    """Lowercased text of every line citing this claim, plus its immediate neighbours."""
    hits = [l["idx"] for l in lines if cid in (l.get("claims") or [])]
    if not hits:
        return ""
    lo, hi = max(0, min(hits) - 1), min(len(lines) - 1, max(hits) + 1)
    return " ".join(l["text"].lower() for l in lines if lo <= l["idx"] <= hi)


def provisional_runtime(script, direction_path):
    """Estimate from current copy and its declared target, never old audio timings.

    target_seconds is the optional top-level numeric field in vo_direction.json.
    Taking the larger estimate avoids a short target hiding a long script, or a
    short script hiding a deliberately slow two-minute read. This cannot replace
    the normal measured check after synthesis.
    """
    words = sum(len(line["text"].split()) for line in script["lines"])
    if not words:
        raise ValueError("the current narration has no spoken words")
    estimate = words / PROVISIONAL_WORDS_PER_SECOND
    try:
        with open(direction_path) as stream:
            direction = json.load(stream)
    except FileNotFoundError:
        direction = {}
    if not isinstance(direction, dict):
        raise ValueError("vo_direction.json must be an object")
    target = direction.get("target_seconds")
    if "target_seconds" in direction:
        if (isinstance(target, bool) or not isinstance(target, (int, float))
                or not math.isfinite(target) or target <= 0):
            raise ValueError("vo_direction.target_seconds must be a finite positive number")
    seconds = max(estimate, target or 0.0)
    declared = f"declared target {target:g}s" if target is not None else "no declared target"
    detail = (f"{seconds:.2f}s = max({declared}, {words} current-script words / "
              f"{PROVISIONAL_WORDS_PER_SECOND:g} words/sec = {estimate:.2f}s)")
    return seconds, detail


def _words(s):
    return " ".join(re.findall(r"[a-z0-9']+", str(s or "").lower()))


def plan(claims_list, target_seconds):
    """The claim plan, from claims.json alone, at the end of Phase 2 and before a VO is written.

    Machine pass 2026-10-22, a repeat offender (10-18, 10-22). Twice the density floor below
    failed only once a script existed: 6.1 claims a minute on 10-22 until c15 to c17 were split
    out of compound claims and a line was cut. The cause is upstream. The fact-checker writes one
    `spoken` per claim, often two or three facts long, and the script spends about one line per
    claim. So this runs on the safe set before the script. It FAILS when the set holds fewer
    claims than the floor needs at the declared target runtime, counted the way the density gate
    counts them, and it NAMES the split candidates: every spoken of more than one sentence, and
    every claim whose words all sit inside another claim (10-22's c10 inside c9), which a line
    voices for free and which is no substitute for a new fact. Returns (problems, notes)."""
    need = math.ceil(MIN_CLAIMS_PER_MIN * target_seconds / 60.0)
    words = {c["id"]: set(_words(c.get("spoken")).split()) for c in claims_list}
    notes = []
    for c in claims_list:
        a = c["id"]
        for b, wb in words.items():
            wa = words[a]
            if a != b and len(wa) >= 3 and wa <= wb and (len(wa) < len(wb) or a > b):
                notes.append(f"{a} restates {b} (every word of its spoken is in {b}'s)")
                break
    for c in claims_list:
        n = len([s for s in re.split(r"(?<=[.?!])\s+", str(c.get("spoken") or "").strip()) if s])
        if n > 1:
            notes.append(f"{c['id']} spoken carries {n} sentences, a candidate to split into atomic claims")
    problems = []
    if len(claims_list) < need:
        problems.append(
            f"CLAIM PLAN: {len(claims_list)} claims in claims.json against the {need} a "
            f"{target_seconds:g}s film needs at {MIN_CLAIMS_PER_MIN:g} a minute. The script spends "
            f"about one line per claim, so this safe set fails the density floor before a word is "
            f"written. Split compound claims into one spoken fact each (the notes name the "
            f"candidates) and give each its own id, source and requires.")
    return problems, notes


def _target_seconds():
    try:
        for ln in open(os.path.join(REPO, "config", "state.yaml")):
            m = re.match(r"dispatch_target_seconds:\s*([0-9.]+)", ln)
            if m:
                return float(m.group(1))
    except OSError:
        pass
    return 120.0


def _plan_self_test():
    fails = []
    def mk(n, extra=()):
        return [{"id": f"c{i + 1}", "spoken": f"fact number {i + 1} is true."} for i in range(n)] + list(extra)
    p, _ = plan(mk(14), 120)
    print(f"  [{'x' if not p else ' '}] 14 atomic claims at 120s pass")
    fails += p
    p, _ = plan(mk(13), 120)
    print(f"  [{'x' if p else ' '}] 13 claims at 120s fail (14 needed)")
    fails += [] if p else ["short safe set passed"]
    _, n = plan(mk(13, [{"id": "c14", "spoken": "The state says the data will help."},
                        {"id": "c15", "spoken": "The state offers it, and says the data will help."}]), 120)
    ok = any("c14 restates c15" in x for x in n) and not any(x.startswith("c15 restates") for x in n)
    print(f"  [{'x' if ok else ' '}] a claim restated inside another is named, the fuller one is not")
    fails += [] if ok else ["restated claim not named"]
    _, n = plan(mk(13, [{"id": "c14", "spoken": "It calls itself a generator. It screens data."}]), 120)
    ok = any(x.startswith("c14 spoken carries 2 sentences") for x in n)
    print(f"  [{'x' if ok else ' '}] a two-sentence spoken is named as a split candidate")
    fails += [] if ok else ["compound spoken not named"]
    p, _ = plan(mk(15), 130)
    print(f"  [{'x' if p else ' '}] 15 claims at 130s fail (16 needed)")
    fails += [] if p else ["130s floor not applied"]
    print("SELF-TEST", "FAIL" if fails else "PASS")
    return 1 if fails else 0


def main():
    if "--plan-self-test" in sys.argv:
        return _plan_self_test()
    if "--plan" in sys.argv:
        with open(os.path.join(OUT, "claims.json")) as stream:
            claims_list = json.load(stream)["claims"]
        target = _target_seconds()
        problems, notes = plan(claims_list, target)
        for n in notes:
            print(f"  NOTE {n}")
        if problems:
            print("FAIL [vo_claims_check --plan]")
            for p in problems:
                print(f"  {p}")
            return 1
        print(f"PASS [vo_claims_check --plan] {len(claims_list)} claims reach the "
              f"{math.ceil(MIN_CLAIMS_PER_MIN * target / 60.0)} a {target:g}s film needs. Give every "
              f"vo_script line a `claims` list of the ids it voices.")
        return 0
    show = "--list" in sys.argv
    before_synth = "--before-synth" in sys.argv
    with open(os.path.join(OUT, "vo_script.json")) as stream:
        script = json.load(stream)
    with open(os.path.join(OUT, "claims.json")) as stream:
        claims_doc = json.load(stream)
    claims = {c["id"]: c for c in claims_doc["claims"]}

    problems, notes = [], []
    for line in script["lines"]:
        idx, text = line["idx"], line["text"]
        cited = [c for c in line.get("claims", []) if c in claims]
        low = text.lower()

        for pat, why in BANNED:
            if re.search(pat, text, re.I):
                problems.append(f"L{idx}: {why}\n      {text}")
        # The owner's banned words (2026-09-27), from config/brand.yaml via word_ban.py.
        for w in word_ban.hits(text):
            problems.append(f"L{idx}: '{w}' is a banned word (owner rule 2026-09-27)\n      {text}")

        # Obligations are satisfied across the CLAIM'S SPAN, not line by line. The
        # first build of this gate checked each line alone and fired on "Mina read the
        # pressure right" for not containing "June", although the line that introduces
        # her says "In June" two lines earlier. A guard that fires on a correct script
        # gets disabled, so the clause is loosened rather than the guard removed.
        for cid in cited:
            span = _claim_span(script["lines"], cid)
            for req in claims[cid].get("requires", []):
                rl = req.lower()
                for needle, token in MUST_CONTAIN:
                    if token and needle in rl and token not in span:
                        problems.append(
                            f"{cid} obligation not met ANYWHERE in the lines that cite it:\n"
                            f"        {req}\n"
                            f"      no line in the claim's span contains '{token}'. "
                            f"Span is L{_span_ids(script['lines'], cid)}.")

        # A CITED LINE IS NOT A SOURCED CADENCE. "The aim is a new one any hour" carries a claim
        # id and that claim says nothing about hours, so a `not cited` test passes it. For a rate
        # the citation has to actually CONTAIN the rate: the cadence words, or an equivalent, must
        # appear in the claim's own verbatim_source. Anything else is the film borrowing a claim's
        # credibility for an assertion the claim never made.
        # an OUTLET NAME is not a rate: "Daily News" (2026-10-05) tripped the 'daily' cadence on
        # three lines that were only naming the Anchorage Daily News.
        m = CADENCE.search(re.sub(r"\bDaily News\b", "", text))
        if m:
            word = m.group(0).lower()
            backing = " ".join(
                str(claims[c].get("verbatim_source") or "") + " " + str(claims[c].get("spoken") or "")
                for c in cited).lower()
            if not cited:
                problems.append(
                    f"line {idx}: asserts a CADENCE ({word!r}) with no claim id. A rate is a factual "
                    f"claim about how often something happens and is as load-bearing as a number.\n"
                    f"      {text[:150]}")
            elif word not in backing:
                problems.append(
                    f"line {idx}: asserts a CADENCE ({word!r}) and cites {','.join(cited)}, but none of "
                    f"those claims' verbatim source says it. A citation is not a licence for a rate "
                    f"the record never states. Say what the record says, or drop the cadence.\n"
                    f"      {text[:150]}")
        if QUANT.search(text) and not cited and not DATEISH.search(text):
            problems.append(
                f"L{idx} states a quantity and cites NO claim id. Every number in the "
                f"narration must trace to the fact-check-safe set.\n      {text}")

        if show:
            notes.append(f"  L{idx:<3} claims={','.join(cited) or '-':<12} {text[:64]}")

    if show:
        print("\n".join(notes))
        print(f"\nvo_claims_check: {len(script['lines'])} lines, "
              f"{sum(1 for l in script['lines'] if l.get('claims'))} carry a claim id")

    # SPELLED TTS TOKENS WITH NO CAPTION FIXUP (machine pass 2026-10-22, repeat offender on
    # 10-20 and 10-22). The script spells initialisms and numbers for the synth ("C E O",
    # "forty five thousand"), and captions are aligned from that audio, so each one reaches the
    # screen unless caption_fixups maps it. Both runs learned it from the editor after a render.
    # This is the script stage, before synth, so it names the map entry to add. It WARNS: a
    # number word can be right on a caption. caption_spelling_check fails an undeclared spaced
    # initialism in the built props before the render.
    try:
        from caption_spelling_check import uncovered
    except ImportError:
        from scripts.caption_spelling_check import uncovered
    fixups = script.get("caption_fixups") or {}
    spelled = []
    for line in script["lines"]:
        for kind, phrase in uncovered(line["text"], fixups):
            spelled.append(f"L{line['idx']}: {kind} {phrase!r} has no caption_fixups entry")
    for w in dict.fromkeys(spelled):
        print(f"WARN [vo_claims_check] {w}")
    if spelled:
        print('WARN [vo_claims_check] add each to "caption_fixups" in out/dispatch/vo_script.json '
              '(spoken form to screen form, for example "C E O": "CEO", "twenty five thousand": '
              '"25,000") now, before the editor finds it on a caption.')

    problems = list(dict.fromkeys(problems))
    # ---- STORY DENSITY (2026-08-13, owner: "ever since we went to 2 mins, it feels like ur
    # stretching a story instead of telling more of it").
    #
    # Measured on the 08-13 film and the number settles the question. 21 claims researched and
    # verified. The narration used 13. Eight verified facts were left on the floor, including the
    # companion award, the PI's title and four sourced ACEP items. The film ran 135.6s carrying
    # 5.8 claims a minute with 14 percent of its runtime in silence.
    #
    # So it was not that the plan was thin and not that edit rounds mangled the flow. It is that
    # NOTHING TIED RUNTIME TO STORY CONTENT. A run could research 21 facts, write 13 into the
    # narration, spread them over two minutes, and pass every gate in the repo. Length was free.
    # It is not free any more: a longer film has to EARN its length in facts, or be shorter.
    total_claims = len(claims)
    used = set()
    for ln in script["lines"]:
        used.update(c for c in (ln.get("claims") or []) if c in claims)
    # NOT a bare except. A silent swallow here is how this very check sat dead on its first
    # run: it referenced a name this module does not define, raised, and the handler hid it.
    secs = 0.0
    if before_synth:
        try:
            secs, estimate_detail = provisional_runtime(
                script, os.path.join(OUT, "vo_direction.json"))
            print("PROVISIONAL [before-synth density estimate] " + estimate_detail +
                  "; vo_lines.json is not read. Measured validation is still required after synthesis.")
        except (OSError, ValueError, KeyError, TypeError) as _e:
            problems.append(f"STORY DENSITY: cannot form a PROVISIONAL before-synth estimate ({_e}). "
                            "Fix the current script/direction before spending on voice synthesis.")
        if not used:
            problems.append("STORY DENSITY: no verified claim IDs are voiced in the current script.")
    else:
        _vl = os.path.join(REPO, "out", "dispatch", "vo_lines.json")
        try:
            with open(_vl) as stream:
                secs = max(x["end"] for x in json.load(stream)["lines"])
        except (OSError, ValueError, KeyError) as _e:
            problems.append(f"STORY DENSITY: cannot measure runtime from {_vl} ({_e}). The density "
                            f"floor is unenforceable without it, so this is a failure, not a skip.")
    if secs > 0 and used:
        per_min = len(used) / secs * 60.0
        coverage = len(used) / total_claims
        if per_min < MIN_CLAIMS_PER_MIN:
            runtime_kind = "PROVISIONAL estimated " if before_synth else ""
            problems.append(
                f"STORY DENSITY: {len(used)} claims across {runtime_kind}{secs:.0f}s is {per_min:.1f} per minute, "
                f"under the {MIN_CLAIMS_PER_MIN} floor. This is the signature of a stretched film: "
                f"the runtime grew and the story did not. Either put more of the record on screen "
                f"or make the film shorter.")
        if coverage < MIN_CLAIM_COVERAGE:
            unused = sorted(set(claims) - used, key=lambda x: int(re.sub(r"\D", "", x) or 0))
            problems.append(
                f"STORY DENSITY: the narration uses {len(used)} of {total_claims} verified claims "
                f"({coverage:.0%}, floor {MIN_CLAIM_COVERAGE:.0%}). Unused: {', '.join(unused)}. "
                f"Research that never reaches the film is a film telling less than it knows.")

    if problems:
        print("FAIL [vo_claims_check] the narration violates the fact-check-safe set.")
        for p in problems:
            print(f"  {p}")
        print()
        print("  Fix the SCRIPT, not the audio. This gate runs before any TTS is spent")
        print("  precisely so a false line never reaches a synth.")
        sys.exit(1)

    print(f"PASS [vo_claims_check] {len(script['lines'])} narration lines checked against "
          f"{len(claims)} claims; no obligation violated, no unsourced quantity and no unsourced cadence.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
