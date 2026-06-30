#!/usr/bin/env python3
"""
GATE 0 — COMPOSITION DIVERGENCE (objective, runs BEFORE any frame is rendered).

This is the structural answer to the cookie-cutter failure: the routine kept opening the repo,
copying the last render script, re-skinning the hero, and shipping a composition identical to the
prior video (the salmon that "looked just like the damn beluga video"). A new subject is not a new
composition. This gate makes "different video" measurable and refuses to let a re-skin proceed.

It reads:
  out/dispatch/storyboard.json   the planned composition FINGERPRINT (7 axes) + beats + notes
  config/state.yaml              dispatch_history, each entry carrying its own composition fingerprint
  config/composition_axes.yaml   the axes + the divergence rule

and FAILS (exit 1) if the plan is incomplete, admits it was derived from a prior render, or its
composition re-skins a recent dispatch (too few differing axes / a repeated spatial signature /
a repeated palette). Exit 0 = the composition is genuinely distinct; you may build it.

  python scripts/storyboard_check.py [path/to/storyboard.json]

Same contract as quality_gate.py / caption_check.py: machine-checked, no cap, fix the cause and
re-run. You do not get to relax the rule to pass — you change the composition.
"""
import sys, json, re
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parent.parent
STATE = ROOT / "config" / "state.yaml"
AXES = ROOT / "config" / "composition_axes.yaml"
DEFAULT_SB = ROOT / "out" / "dispatch" / "storyboard.json"

CONTROLLED = ["pov", "motion_vector", "hero_treatment", "layout", "register"]  # exact-tag axes
FREETEXT = ["palette", "metaphor"]                                             # token-overlap axes
ALL_AXES = CONTROLLED + FREETEXT
STOP = {"the", "a", "an", "of", "in", "and", "for", "to", "on", "with", "by", "ai", "+", "·", "-"}


def norm_tag(s):
    return re.sub(r"\s+", "-", str(s or "").strip().lower())


def tokens(s):
    return {w for w in re.findall(r"[a-z0-9]+", str(s or "").lower()) if w not in STOP and len(w) > 1}


def overlap_match(a, b, min_shared=2, jaccard=0.34):
    """Free-text axes (palette/metaphor) 'match' when they share real vocabulary."""
    ta, tb = tokens(a), tokens(b)
    if not ta or not tb:
        return norm_tag(a) == norm_tag(b)
    shared = ta & tb
    j = len(shared) / len(ta | tb)
    return len(shared) >= min_shared or j >= jaccard


def axis_matches(axis, new_v, old_v):
    if axis in FREETEXT:
        return overlap_match(new_v, old_v)
    return norm_tag(new_v) == norm_tag(old_v)


def fp_of(entry):
    """Pull a composition fingerprint from a history entry (new 'composition' block; tolerate older
    entries by falling back to their free-text archetype/palette so the gate still has something)."""
    comp = entry.get("composition") or {}
    fp = {ax: comp.get(ax, "") for ax in ALL_AXES}
    if not fp.get("palette"):
        fp["palette"] = entry.get("palette", "")
    if not any(fp[ax] for ax in CONTROLLED):
        # legacy entry with only a free-text archetype: stuff it into metaphor so palette+metaphor
        # still get compared (better than silently treating it as fully distinct).
        fp["metaphor"] = entry.get("archetype", "") or fp.get("metaphor", "")
    return fp


def fail(msg):
    print(f"FAIL [storyboard_check] {msg}")
    sys.exit(1)


def main():
    sb_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SB
    if not sb_path.exists():
        fail(f"no storyboard at {sb_path} — Phase 4.5 must WRITE the board before any render. "
             f"Required fields: concept, derived_from, fingerprint{{{','.join(ALL_AXES)}}}, beats[], divergence_note.")
    sb = json.loads(sb_path.read_text())
    axcfg = yaml.safe_load(AXES.read_text())
    rule = axcfg["rule"]
    smin = axcfg["storyboard_min"]
    shotcfg = yaml.safe_load((ROOT / "config" / "shot_structure.yaml").read_text())
    srule = shotcfg["rule"]; SHOT_FRAMINGS = set(shotcfg.get("framings", [])); SHOT_TRANS = set(shotcfg.get("transitions", []))
    state = yaml.safe_load(STATE.read_text()) or {}
    history = state.get("dispatch_history", [])

    problems = []

    # ---- 1. completeness: planning can't be a stub ----
    fp = sb.get("fingerprint") or {}
    for fld in smin["required_fields"]:
        if fld == "palette":
            if not (sb.get("palette") or fp.get("palette")):
                problems.append("missing required field: palette (in fingerprint)")
        elif fld == "fingerprint":
            if not fp:
                problems.append("missing required field: fingerprint")
        elif not sb.get(fld):
            problems.append(f"missing required field: {fld}")
    missing_axes = [ax for ax in ALL_AXES if not fp.get(ax)]
    if missing_axes:
        problems.append(f"fingerprint missing axes: {missing_axes} (all 7 must be declared)")
    beats = sb.get("beats") or []
    if len(beats) < smin["beats"]:
        problems.append(f"only {len(beats)} beats; need >= {smin['beats']} story-advancing beats "
                        f"(matches the BEAT_DENSITY video gate)")
    dnote = sb.get("divergence_note", "")
    if len(dnote) < smin["divergence_note_min_chars"]:
        problems.append(f"divergence_note is {len(dnote)} chars; need >= {smin['divergence_note_min_chars']} "
                        f"— SAY in prose how this differs from the last 2 dispatches (forces the thinking).")

    # ---- 1b. SHOT STRUCTURE: the board must be a SEQUENCE of shots, not one 'oner' (config/shot_structure.yaml) ----
    shots = sb.get("shots") or []
    if len(shots) < srule["min_shots"]:
        problems.append(f"only {len(shots)} shots; need >= {srule['min_shots']} distinct shots with motivated "
                        f"transitions (a scene change ~every 10-15s — NOT one continuous 'oner' like the sonar Dispatch).")
    else:
        framings = [str(s.get("framing", "")).strip().lower() for s in shots]
        if len({f for f in framings if f}) < srule["min_distinct_framings"]:
            problems.append(f"shots use only {len({f for f in framings if f})} distinct framings; need >= "
                            f"{srule['min_distinct_framings']} (vary the shot types: {sorted(SHOT_FRAMINGS)}).")
        unknown_fr = sorted({f for f in framings if f and f not in SHOT_FRAMINGS})
        if unknown_fr:
            problems.append(f"shots use framings outside the vocab: {unknown_fr} (use config/shot_structure.yaml `framings`).")
        if srule.get("require_transitions", True):
            no_tr = [s.get("id", i + 2) for i, s in enumerate(shots[1:]) if not str(s.get("transition_in", "")).strip()]
            if no_tr:
                problems.append(f"shots {no_tr} declare no transition_in — every shot after the first needs a motivated "
                                f"transition ({sorted(SHOT_TRANS)}).")
            bad_tr = sorted({str(s.get("transition_in", "")).strip().lower() for s in shots[1:]
                             if str(s.get("transition_in", "")).strip() and str(s.get("transition_in", "")).strip().lower() not in SHOT_TRANS})
            if bad_tr:
                problems.append(f"shots use transitions outside the vocab: {bad_tr} (use config/shot_structure.yaml `transitions`).")

    # ---- 2. the banned shortcut: a scene copied from a prior render and re-skinned ----
    if rule.get("require_derived_from_scratch", True):
        df = norm_tag(sb.get("derived_from", ""))
        if df != "scratch":
            problems.append(f"derived_from='{sb.get('derived_from')}' — the scene must be authored from "
                            f"scratch to this board. Copying a prior render_*.py to re-skin it is the "
                            f"banned cookie-cutter shortcut. Set derived_from: scratch and mean it "
                            f"(shared HELPERS are imported from dispatch_core, not copied).")

    if problems:
        for p in problems:
            print(f"FAIL [storyboard_check] {p}")
        sys.exit(1)

    # ---- 3. divergence vs recent history (only if we have prior dispatches) ----
    recent = history[-rule["compare_last_n"]:] if history else []
    for old in recent:
        ofp = fp_of(old)
        diff = [ax for ax in ALL_AXES if not axis_matches(ax, fp.get(ax), ofp.get(ax))]
        same = [ax for ax in ALL_AXES if ax not in diff]
        if len(diff) < rule["min_diff_axes"]:
            problems.append(
                f"too close to {old.get('date')} \"{old.get('slug') or old.get('topic')}\": differs on only "
                f"{len(diff)}/{len(ALL_AXES)} axes (need >= {rule['min_diff_axes']}). SAME on {same}. "
                f"Redesign the composition, don't re-skin it.")

    # ---- 4. spatial signature (pov, layout, motion_vector) must be unique ----
    sig_axes = rule["signature_axes"]
    new_sig = tuple(norm_tag(fp.get(ax)) for ax in sig_axes)
    for old in (history[-rule["signature_window"]:] if history else []):
        ofp = fp_of(old)
        old_sig = tuple(norm_tag(ofp.get(ax)) for ax in sig_axes)
        if old_sig == new_sig and all(old_sig):
            problems.append(
                f"spatial signature {dict(zip(sig_axes, new_sig))} repeats {old.get('date')} "
                f"\"{old.get('slug') or old.get('topic')}\". This (pov, layout, motion) triple is the exact "
                f"thing that made the salmon a beluga clone. Change at least one of {sig_axes}.")

    # ---- 5. palette must not repeat the last 2 ----
    for old in (history[-rule["palette_window"]:] if history else []):
        if overlap_match(fp.get("palette"), fp_of(old).get("palette")):
            problems.append(
                f"palette \"{fp.get('palette')}\" repeats {old.get('date')} \"{fp_of(old).get('palette')}\". "
                f"Choose a fresh color world (rubric hard_blocker).")

    if problems:
        for p in problems:
            print(f"FAIL [storyboard_check] {p}")
        sys.exit(1)

    print(f"PASS [storyboard_check] composition is distinct: {sb.get('concept', '(unnamed)')}")
    print(f"  fingerprint: " + "  ".join(f"{ax}={fp.get(ax)}" for ax in ALL_AXES))
    if recent:
        print(f"  diverges from last {len(recent)}: " +
              "; ".join(f"{o.get('date')}→{len([ax for ax in ALL_AXES if not axis_matches(ax, fp.get(ax), fp_of(o).get(ax))])}/{len(ALL_AXES)} axes differ"
                        for o in recent))
    print(f"  beats: {len(beats)}   signature: {dict(zip(sig_axes, new_sig))}")
    sys.exit(0)


if __name__ == "__main__":
    main()
