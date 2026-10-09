#!/usr/bin/env python3
"""
caption_check.py — OBJECTIVE linter for the Dispatch LinkedIn caption (the post text
delivered in the Gmail draft). The checks-and-balances twin of quality_gate.py: it runs
BEFORE the subjective scorecard (config/linkedin_caption_rubric.yaml) and fails the caption
numerically on the measurable rules, so a weak caption never reaches the inbox.

Rules are grounded in 2026 LinkedIn data:
  - dwell time is the ranking signal; the hook must earn the "see more" inside the mobile fold
  - 1,300-1,900 chars is the engagement sweet spot; 3,000 is LinkedIn's hard cap
  - 3-5 hashtags, at the END (>5 = ~68% reach cut; hashtags in the middle read as spam)
  - clean whitespace + restraint; over-formatting (emoji/■ per line, Unicode-bold) reads as AI
  - brand voice bans em/en dashes, COLONS, SEMICOLONS, curly quotes; ranges written "X to Y"
  - no sentence may start with "But" (owner, 2026-08-06)
  - this docstring is not the spec. BANNED_PUNCT and the lint() body are. It is listed here
    because on 2026-08-06 four rules that WERE all implemented and all hard fails still
    shipped, and the post-mortem turned on people reading a summary instead of the code.

  python scripts/caption_check.py out/dispatch/post.txt    # the ONE copy file; also reads stdin
Writes caption_report.json next to the input (or cwd). Exit 0 = PASS, 1 = FAIL.
"""
import sys, os, re, json

FOLD=140            # mobile "see more" fold (chars)
HARD_MAX=3000       # LinkedIn hard cap
LO,HI=900,2200      # acceptable band (sweet spot 1300-1900; we fail outside the wider band)
AI_TELLS=["delve","tapestry","testament","landscape of","ever-evolving","ever-changing","in today's",
          "navigating the","unlock the","unleash","game-changer","game changer","realm of","at the end of the day",
          "it's important to note","needle-moving","paradigm","synergy","circle back","leverage synerg",
          "embark","robust solution","seamless","cutting-edge","revolutionize","supercharge","skyrocket",
          "here's the honest part","here is the honest part","here's what matters","here is what matters",
          "here's where the frame breaks","here is where the frame breaks"]
# Formal-register words the brand bans outright, mapped to the contraction that replaces
# them. Owner directive 2026-07-30, starting with "cannot". Add to this table rather than
# scattering one-off checks.
BANNED_FORMAL={"cannot":"can't"}

# DATE FORM (owner rule 2026-08-05: "rn ur saying '10 August', the normal way to say it is
# August 10th"). Month name first, day as an ordinal. ISO stays correct for a PROVENANCE
# STAMP (a citation line, a filename, a ledger field) but a sentence a human reads takes
# "August 10th". These patterns catch the four wrong forms without touching a bare month,
# a bare year, or an ISO stamp.
MONTHS = ("January|February|March|April|May|June|July|August|September|October|November|December")
ABBREV = r"Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec"
DATE_FORMS = [
    # "10 August" / "10th August" -- day first
    (re.compile(r"\b(\d{1,2})(?:st|nd|rd|th)?\s+(" + MONTHS + r")\b"),
     "day-first", "write the month first with an ordinal day, e.g. August 10th"),
    # "August 10" with no ordinal, but NOT "August 2026" and NOT "August 10th"
    (re.compile(r"\b(" + MONTHS + r")\s+(\d{1,2})(?!\s*(?:st|nd|rd|th))(?!\d)"),
     "no ordinal", "add the ordinal, e.g. August 10th"),
    # "the 10th of August"
    (re.compile(r"\bthe\s+\d{1,2}(?:st|nd|rd|th)\s+of\s+(" + MONTHS + r")\b"),
     "of-form", "write it plainly, e.g. August 10th"),
    # "Aug 10" -- abbreviated month in prose
    (re.compile(r"\b(" + ABBREV + r")\.?\s+\d{1,2}\b"),
     "abbreviated month", "spell the month out with an ordinal day, e.g. August 10th"),
]

# COMMA DISCIPLINE (owner rule 2026-08-05: "reduce comma usage by 10% on the captions
# moving forward"). MEASURED, not guessed: across the 18 captions this channel had shipped
# as of that date the mean was 5.41 commas per 100 words of body (median 5.36, range 3.57
# to 7.38). Ten percent below the mean is 4.86, so the ceiling is 4.9.
#
# The cure is NOT deleting commas and leaving a run-on, which trades a comma for a worse
# sentence. Split at the comma and let it be two sentences, or cut the clause that was only
# there to be qualified. This voice is already short and declarative, so the commas that go
# are the ones bolting a second thought onto a finished one.
COMMA_PER_100W = 4.9
BANNED_PUNCT={"—":"em dash","–":"en dash",";":"semicolon",":":"colon","“":"curly quote","”":"curly quote","‘":"curly quote","’":"curly apostrophe"}
# Sources + music/voice credit belong in the copy-paste COMMENT block (dispatch_email.py), never
# in the post body (2026-07-21 owner catch: they got pasted into the post AND duplicated, and the
# music credit sat above the hashtags blocking the copy of the post text). Any of these in the
# body is a hard fail.
URL_RE=re.compile(r"https?://|www\.\w|\b\w[\w.-]*\.(?:com|org|gov|net|edu|io)\b", re.I)
CREDIT_RE=re.compile(r"(?im)(^\s*(sources?|music|credits?|composer)\b|licen[sc]ed under|\bcc[\s-]?by\b|creative commons|incompetech)")
EMOJI=re.compile("[\U0001F000-\U0001FAFF\U00002600-\U000027BF\U0001F1E6-\U0001F1FF←-⇿⌀-⏿]")
UNICODE_BOLD=re.compile("[\U0001D400-\U0001D7FF]")     # math alphanumerics = fake bold/italic
BULLETY=re.compile(r"^\s*([•▪✓✅➤→\-\*])\s")

# SENTENCE-INITIAL "BUT" (owner rule 2026-08-06, on the shipped 08-06 caption: "the caption
# started a sentence with the word 'But' which should be banned").
#
# It is a hard fail rather than a style note because of what it does to an argument. This
# channel's whole job is to put two things next to each other and let the reader feel the
# tension. "But" at the front of a sentence spends that tension for the reader: it announces
# the turn before the turn arrives, so the sentence that follows can only confirm what the
# conjunction already promised. The 08-06 caption did it on the load-bearing beat, right
# where the reader should have hit the contradiction themselves.
#
# The fix is never to delete the word and leave the sentence. Either fuse the two sentences
# so the contrast lands inside one thought, or state the second fact flat and let it collide
# on its own. A flat statement after a flat statement IS the contrast.
#
# Only the sentence-initial position is banned; "but" mid-sentence is ordinary English and
# the pattern deliberately does not touch it.
SENTENCE_BUT = re.compile(r"(?:(?<=^)|(?<=[.!?]\s)|(?<=[.!?]\s\s)|(?<=\n))\s*But\b", re.M)

# NO FIRST PERSON IN THE CAPTION (owner rule 2026-10-09: "stop using first person in the actual
# caption"). Measured that day on the 22 captions this channel had shipped: 11 spoke in the first
# person, four of them through "My read is", and that was how each of the last three did it.
#
# The rubric still hard-fails a caption with no point of view, and the two rules agree once the
# position is stated flat. "My read is that the win and the warning are one rule" becomes "The win
# and the warning are one rule". "I think the hard part is the power" becomes "The hard part is the
# power". The claim is the take, and the narrator announcing it adds nothing a reader can argue with.
#
# Exempt, each one measured on the shipped captions or a house rule already:
#   - a verbatim quote inside straight double quotes, so a source's own "we" stays theirs
#   - "US" in capitals, the country
#   - "I" as a numeral after a word like Title, Phase, Class or War
#   - "mine" the noun ("one operating coal mine", 2026-08-09). Only the possessive is first person,
#     so it is flagged after a verb or "of" with nothing noun-like after it ("it isn't mine to make")
# Reported speech without quote marks is NOT exempt. "almost directing us to AI, a state legislator
# said" shipped on 2026-08-08, and the narrator said "us". Quote the words verbatim or report them in
# the third person.
FIRST_PERSON_WORDS = re.compile(r"\b(?:[Mm]e|[Mm]y|[Mm]yself|[Ww]e|[Uu]s|[Oo]ur|[Oo]urs|[Oo]urselves|[Ll]et's)\b")
FIRST_PERSON_I = re.compile(r"(?<![\w.])I(?!\w|-\d|\.\w)")
FIRST_PERSON_MINE = re.compile(r"\b(?:is|isn't|was|wasn't|are|aren't|be|it's|that's|of)\s+mine\b"
                               r"(?=[ \t]*(?:[.,!?\"]|$)|\s+(?:to|and|alone|too|either|now|but|or)\b)",
                               re.I | re.M)
ROMAN_I_HEADS = {"title", "phase", "class", "part", "tier", "type", "stage", "level", "grade", "war",
                 "division", "article", "section", "chapter", "schedule", "region"}
QUOTED = re.compile(r'"[^"\n]*"')

def first_person_hits(text):
    """Every first-person word in the caption's own voice, as (word, context) pairs in order."""
    t = QUOTED.sub(lambda q: " " * len(q.group(0)), text)   # same length, so offsets still hold
    hits = []
    for rx in (FIRST_PERSON_WORDS, FIRST_PERSON_I, FIRST_PERSON_MINE):
        for mm in rx.finditer(t):
            if rx is FIRST_PERSON_I:
                prev = re.search(r"([A-Za-z]+)[ \t]+$", t[:mm.start()])
                if prev and prev.group(1).lower() in ROMAN_I_HEADS:
                    continue
            hits.append((mm.start(), mm.group(0)))
    return [(w, text[max(0, s - 28):s + len(w) + 28].replace("\n", " ").strip())
            for s, w in sorted(hits)]

def lint(text):
    fails=[]; warns=[]; m={}
    t=text.rstrip("\n"); lines=t.split("\n")
    nonempty=[l for l in lines if l.strip()]
    body_chars=len(t); m["chars"]=body_chars
    # hook
    hook=nonempty[0].strip() if nonempty else ""
    m["hook"]=hook; m["hook_len"]=len(hook)
    if not hook: fails.append("HOOK: empty first line")
    elif len(hook)>FOLD: fails.append(f"HOOK: first line {len(hook)} chars > {FOLD} mobile fold — the hook gets cut before 'see more'")
    if hook and hook[-1] not in ".!?\"" and len(hook)<40: warns.append("HOOK: very short opener — make sure it actually stops the scroll")
    # length
    if body_chars>HARD_MAX: fails.append(f"LENGTH: {body_chars} chars > {HARD_MAX} LinkedIn hard cap")
    elif not (LO<=body_chars<=HI): fails.append(f"LENGTH: {body_chars} chars outside {LO}-{HI} (sweet spot 1300-1900)")
    # hashtags
    tags=re.findall(r"(?<!\w)#\w+",t); m["hashtags"]=tags; m["n_hashtags"]=len(tags)
    if not (3<=len(tags)<=5): fails.append(f"HASHTAGS: {len(tags)} found, need 3-5 (>5 = ~68% reach cut)")
    if tags:
        # every hashtag must be in the tail block (after the last non-hashtag sentence)
        tail_start=None
        for i,l in enumerate(lines):
            only_tags=l.strip()!="" and all(w.startswith("#") for w in l.split())
            if only_tags and tail_start is None: tail_start=i
            elif l.strip()=="" : pass
            elif tail_start is not None and not (l.strip()!="" and all(w.startswith("#") for w in l.split())):
                tail_start=None  # body resumed after a tag line
        body_text="\n".join(lines[:tail_start]) if tail_start is not None else t
        if re.search(r"(?<!\w)#\w+", body_text if tail_start is not None else "") and tail_start is not None:
            fails.append("HASHTAGS: a hashtag appears in the body — put all hashtags in one block at the END")
        if tail_start is None:
            fails.append("HASHTAGS: not grouped at the end — place 3-5 hashtags on their own line(s) after the post")
    # CTA / engagement question
    last_chunk="\n".join(nonempty[-4:]) if nonempty else ""
    if "?" not in (t if len(t)<600 else t[-600:]): fails.append("CTA: no engagement question near the end (ask the reader something)")
    # over-formatting (reads as AI / hurts dwell)
    n_emoji=len(EMOJI.findall(t)); n_bold=len(UNICODE_BOLD.findall(t)); n_bullets=sum(bool(BULLETY.match(l)) for l in lines)
    m["emoji"]=n_emoji; m["unicode_bold"]=n_bold; m["bullet_lines"]=n_bullets
    if n_bold>0: fails.append(f"FORMAT: {n_bold} Unicode-bold chars — reads as generated; use plain text + whitespace")
    if n_emoji>3: fails.append(f"FORMAT: {n_emoji} emoji — over-formatted; LinkedIn 2026 rewards restraint")
    if n_bullets>6: warns.append(f"FORMAT: {n_bullets} bullet lines — heavy; prose with whitespace reads more human")
    # brand voice: banned punctuation (colon included — rewrite the sentence, never a colon)
    hits={name for ch,name in BANNED_PUNCT.items() if ch in t}
    if hits: fails.append("PUNCT: brand voice bans "+", ".join(sorted(hits))+" (use periods, commas, parentheses, 'X to Y' ranges — a colon means rewrite the sentence)")
    # SENTENCE-INITIAL "BUT" (owner rule 2026-08-06). Hard fail, and the message names the
    # rewrite rather than the deletion, because dropping the word and keeping the sentence is
    # the wrong fix: it leaves the same two thoughts with the seam still showing.
    but_hits = [mm for mm in SENTENCE_BUT.finditer(t)]
    m["sentence_initial_but"] = len(but_hits)
    for mm in but_hits[:3]:
        ctx = t[mm.start():mm.start() + 74].strip().replace("\n", " ")
        fails.append(f"REGISTER: a sentence starts with \"But\" ({ctx!r}). Banned. It announces "
                     f"the turn before the turn lands, so the reader is told about the "
                     f"contradiction instead of hitting it. Fuse the two sentences, or state "
                     f"the second fact flat and let it collide on its own.")
    # NO FIRST PERSON (owner rule 2026-10-09). Hard fail, and the message names the rewrite,
    # because deleting "I think" and keeping the hedge is not the fix. The claim alone is the take.
    fp = first_person_hits(t)
    m["first_person"] = len(fp)
    if fp:
        shown = "; ".join(f"{w!r} in {ctx!r}" for w, ctx in fp[:3])
        more = f" and {len(fp) - 3} more" if len(fp) > 3 else ""
        fails.append(f"VOICE: first person in the caption ({shown}{more}). Banned (owner rule "
                     f"2026-10-09). Keep the position and drop who holds it. \"My read is that X\" "
                     f"and \"I think X\" become \"X\". Ask the reader, never \"tell me\". A source's "
                     f"own words keep their first person only inside straight double quotes.")
    # CONTRACTION LAW (owner directive 2026-07-30): "ban the word 'cannot', always use
    # 'can't' instead, especially in the captions". "cannot" is the formal register and it
    # reads as institutional writing, which is exactly the voice this brand is not. Enforced
    # here as a HARD FAIL rather than left as a doctrine note, because a style rule nobody
    # checks drifts back within a few runs (see the flat-HUD-chip lesson: a default-off fix
    # is a doctrine reminder wearing a code costume).
    for bad, good in BANNED_FORMAL.items():
        for mm in re.finditer(r"\b" + bad + r"\b", t, re.I):
            fails.append(f"REGISTER: '{mm.group(0)}' is banned, write \"{good}\" (owner rule, "
                         f"contractions keep the voice human, not institutional)")
            break
    # BANNED WORDS (owner rule 2026-09-27, "on both automations ban the words"). The list is
    # config/brand.yaml banned_vocabulary, read by scripts/word_ban.py as whole words. A post
    # with "matters" passed this linter on 2026-10-03 and was caught by hand.
    try:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        import word_ban
        banned = word_ban.hits(t)
    except Exception as e:                     # a missing list is a failure, never a pass
        banned = None
        fails.append(f"BANNED WORDS: could not read the list ({e})")
    if banned:
        fails.append(f"BANNED WORDS: {', '.join(banned)} (owner rule 2026-09-27, both "
                     f"automations). Say the specific thing instead.")
    # DATE FORM. Hard fail, same reasoning as the contraction law: a style rule nobody
    # checks drifts back within a few runs.
    for rx, what, fix in DATE_FORMS:
        mm = rx.search(t)
        if mm:
            fails.append(f"DATE: '{mm.group(0)}' is the {what} form — {fix} "
                         f"(owner rule 2026-08-05). ISO is still right for a citation stamp, "
                         f"but this is a sentence.")
            break

    # COMMA DISCIPLINE. Measured against the body with the hashtag block excluded, which is
    # how the 5.41 baseline was measured, so the ceiling and the measurement agree.
    body_only = re.sub(r"(?m)^\s*#\S+.*$", "", t)
    body_words = len(body_only.split())
    n_commas = body_only.count(",")
    if body_words >= 100:
        per100 = 100.0 * n_commas / body_words
        m["commas_per_100w"] = round(per100, 2)
        if per100 > COMMA_PER_100W:
            allowed = int(COMMA_PER_100W * body_words / 100)
            fails.append(f"COMMAS: {n_commas} commas in {body_words} words is {per100:.2f} per 100, "
                         f"over the {COMMA_PER_100W} ceiling (owner rule 2026-08-05, 10 percent below "
                         f"this channel's shipped mean of 5.41). Cut at least {n_commas - allowed}. "
                         f"Split the sentence at the comma rather than deleting the comma.")

    # sources + credits must NOT be in the post body — they go in the copy-paste comment block
    if URL_RE.search(t): fails.append("BODY: a URL/domain is in the post — sources go ONLY in the Gmail draft's comment block, never in the post text")
    cred=CREDIT_RE.search(t)
    if cred: fails.append(f"BODY: a sources/credit marker ('{cred.group(0).strip()}') is in the post — move sources + music + voice credit to the comment block, keep the post body to hook + argument + question + hashtags")
    # AI tells
    low=t.lower(); tells=sorted({w for w in AI_TELLS if w in low})
    if tells: fails.append("AI-TELLS: drop "+", ".join(tells))
    # whitespace / scannability
    if "\n\n" not in t and body_chars>400: fails.append("FORMAT: one wall of text — add blank lines so it scans on mobile")
    m["passes"]=len(fails)==0
    return fails, warns, m

def self_test():
    """The first-person rule goes red on what shipped and stays quiet on what it must not touch.

    Planted sentences cover each word and each exemption. The shipped captions are the proof that
    it reads real posts the way the owner does. 10-09 said "I think" and "My read is". 10-05 said
    "My read is" beside a legislator's quoted "We need ... happen to us". 08-09 said "coal mine",
    and 10-02 had no first person.
    """
    repo = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    flagged = ["I think the hard part is the power.", "My read is simple.", "We built it in Nome.",
               "The spreadsheet would not open for us.", "Let's be plain about it.",
               "Our state paid for it.", "It isn't mine to make.", "I'm wrong, and I'd like to be.",
               "Tell me where the model breaks.", "It is almost directing us to AI, a legislator said."]
    clean = ["The US Department of Energy paid for it.", "Title I money reached Bethel.",
             "The state has one operating coal mine.", "It began after World War I.",
             'She said, "We need to be deliberate with how we want to engage with AI."',
             "#WeAreAlaska #AI", "The closure of mine sites is the slow part.", "The mine is idle.",
             "Phase I ends in May.", "A.I. is the wrong spelling.", "Which would you bet on?"]
    shipped = {"runs/2026-10-09/post.txt": ["I", "My"], "runs/2026-10-05/post.txt": ["My"],
               "runs/2026-08-09/post.txt": [], "runs/2026-10-02/post.txt": []}
    bad = []
    for s in flagged:
        if not first_person_hits(s):
            bad.append(f"missed first person in {s!r}")
    for s in clean:
        if first_person_hits(s):
            bad.append(f"false alarm on {s!r}: {first_person_hits(s)}")
    for rel, want in shipped.items():
        path = os.path.join(repo, rel)
        if not os.path.exists(path):
            bad.append(f"{rel} is missing, so the shipped replay can't run")
            continue
        got = [w for w, _ in first_person_hits(open(path, encoding="utf-8").read())]
        if got != want:
            bad.append(f"{rel} gave {got}, expected {want}")
    sample = "\n\n".join(["A plain hook line about Nome.", "My read is that it holds.", "Why?"])
    if not any(f.startswith("VOICE:") for f in lint(sample)[0]):
        bad.append("lint() did not fail a caption saying 'My read is'")
    for b in bad:
        print("  ✗ " + b)
    print(f"caption_check self-test: {'FAIL' if bad else 'PASS'} ({len(flagged)} flagged, "
          f"{len(clean)} clean, {len(shipped)} shipped captions replayed)")
    return 1 if bad else 0

def main():
    src=None
    if sys.argv[1:2] == ["--self-test"]: sys.exit(self_test())
    if len(sys.argv)>1 and os.path.exists(sys.argv[1]): src=sys.argv[1]; text=open(src,encoding="utf-8").read()
    else: text=sys.stdin.read()
    # AN EMPTY READ IS AN INVOCATION ERROR, NOT A FAILING POST (2026-08-08). Called with no
    # path and nothing on stdin, this linted "" and printed a confident RESULT: FAIL with
    # four rule violations against a post that was in fact fine — and, worse, wrote that
    # verdict to caption_report.json in the CURRENT DIRECTORY, so a run could overwrite a
    # real report with the lint of nothing. Same family as the gates this run found passing
    # on the wrong file, in the opposite direction: a confident answer about a subject that
    # was never supplied.
    if not text.strip():
        print("caption_check: no text. Pass a path (scripts/caption_check.py out/dispatch/post.txt)")
        print("  or pipe the post on stdin. Refusing to lint an empty string and report it as")
        print("  a failing post, and refusing to write caption_report.json.")
        sys.exit(2)
    fails,warns,m=lint(text)
    out=os.path.join(os.path.dirname(os.path.abspath(src)) if src else os.getcwd(),"caption_report.json")
    json.dump({"pass":m["passes"],"fails":fails,"warns":warns,"metrics":m},open(out,"w"),indent=2)
    print("=== LinkedIn caption linter ===")
    print(f"  chars={m['chars']} (band {LO}-{HI}) | hook={m['hook_len']}c (fold {FOLD}) | hashtags={m['n_hashtags']} | emoji={m['emoji']} bold={m['unicode_bold']}")
    for w in warns: print("  ! "+w)
    if fails:
        print("RESULT: FAIL ✗"); [print("  ✗ "+f) for f in fails]; sys.exit(1)
    print("RESULT: PASS ✓ — clears the objective rules; now score config/linkedin_caption_rubric.yaml"); sys.exit(0)

if __name__=="__main__": main()
