#!/usr/bin/env python3
"""Compile a Dispatch scene spec into an episode the engine renders and every gate can read.

WHY THIS EXISTS (2026-10-02, the cost project; owner: "build the scene system")
-----------------------------------------------------------------------------
Each Dispatch episode was 15 to 67 KB of hand-written TSX, and the build phase was where a run
spent most of its calls: write a scene, typecheck it, probe a frame, fix the plate that ran off
the edge, re-probe, find the beat the board described and the engine never animated. Most of
that code restated the same craft rules (anticipation and overshoot, a slow push, parallax,
contact shadows, a snap-zoom at the peak, a motivated transition), and every restatement was a
place to get one wrong.

Now the film is DATA. A run writes out/dispatch/scene_spec.json: for each storyboard shot, the
world, the staged layers (library assets with their params, where they sit, how they enter and
leave, what life they have), the plates (claims strings by id), the effects, the camera and the
transition, all timed to beats, VO lines or spoken words. This compiler checks it and writes an
ordinary episode file in the shape the engine and the gates already know, built on the shared
grammar in video-engine/src/lib/scene.tsx. Bespoke art still exists: a run builds its hero
illustrations as reusable components in lib/ and the spec stages them.

WHAT IT REFUSES, before a single frame renders (each one is a defect a judge has paid to find):
  - an anchor that does not resolve, or lands outside its own shot, so the action is never seen
  - a storyboard beat that no action in its shot is timed to: the board says it, the build
    never draws it (2026-08-06, five of eight figures held a static pose the board had acted)
  - a beat timed inside a DIFFERENT shot than the board files it under
  - a plate whose string is not a claims.json on_screen string
  - a plate off the side safe area, across the square crop, or inside the caption band
  - two plates sharing pixels while both are visible
  - visible text that breaks the house rules (a colon, semicolon, em or en dash, "cannot")
  - a sound kind the foley bank lacks, a pan wider than the mix allows, two consecutive beats on
    the same kind, more than one riser
  - an asset name the library does not export (with the closest names)
The episode it writes is then typechecked by tsc like any other, which checks every prop.

THE WORD TIMINGS ARE out/dispatch/audio/words.json. out/dispatch/words.json is not written by
the current voice pipeline, and on 2026-10-02 the copy at that path belonged to a different film
(it opened "The Air Force"), the stale-artifact-at-the-right-path class run_guard exists for. The
compiler reads the voice pipeline's own file and refuses it when its words do not spell the
current vo_lines.json.

USAGE
  python3 scripts/scene_compile.py                  # compile out/dispatch/scene_spec.json
  python3 scripts/scene_compile.py --check          # validate and confirm the episode is current
  python3 scripts/scene_compile.py --spec <path> --out-dir <dir>   # compile elsewhere (proofs)
  python3 scripts/scene_compile.py --assets [query] # list library components the spec may use
  python3 scripts/scene_compile.py --self-test

The spec format is documented in docs/craft/SCENE_SPEC.md.
"""
import argparse
import difflib
import hashlib
import json
import math
import os
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
OUT = REPO / "out" / "dispatch"
SRC = REPO / "video-engine" / "src"
LIB = SRC / "lib"
FPS = 30
COMPILER_VERSION = 1

sys.path.insert(0, str(REPO / "scripts"))

SQUARE_TOP, SQUARE_BOT = 420, 1500
CAPTION_TOP, CAPTION_BOT = 1330, 1475
SIDE = 54
MONO_ADV = 0.602
PLATE_LS = 1.5
PLATE_PAD = 56
SVG_TAGS = {"rect", "circle", "ellipse", "path", "line", "polygon", "polyline", "g", "text"}
ENTER = {"none", "fade", "pop", "drop", "slam", "rise", "slide-left", "slide-right", "whip-left",
         "whip-right", "unfold", "grow"}
EXIT = {"none", "fade", "drop", "lift", "slide-left", "slide-right", "whip-left", "whip-right", "shrink"}
IDLE = {"none", "breathe", "bob", "sway", "float", "flicker", "jitter"}
FX_KINDS = {"impact", "speed", "paper", "glint", "rings", "puff", "motes"}
TRANSITIONS = {"cut", "match", "whip-left", "whip-right", "wipe-left", "wipe-right", "iris", "flash", "dip", "rise"}
PLATE_TONES = {"dark", "paper", "accent"}
SOUND_CLASSES = {"hero", "standard", "texture"}
MAX_PAN = 0.35
BANNED = [(":", "a colon"), (";", "a semicolon"), ("—", "an em dash"), ("–", "an en dash")]
ANCHOR_RE = re.compile(
    r"^(?:(?P<s>s)|(?P<e>e)|b:(?P<b>\d+)|L:(?P<L>\d+)|w:(?P<w>[A-Za-z0-9'&.]+?)(?:#(?P<n>\d+))?"
    r"|t:(?P<t>\d+(?:\.\d+)?))(?P<off>[+-]\d+(?:\.\d+)?)?$")
DEFAULT_PALETTE = {
    "bg": "#0F171C", "ink": "#141A1F", "cream": "#F4F2EA", "plate": "#0F171C", "plateEdge": "#F4F2EA",
    "paper": "#ECEEEA", "paperEdge": "#2B211A", "accent": "#E8590C", "accentEdge": "#141A1F",
    "captionBg": "#0C1418", "captionEdge": "#F4F2EA", "captionText": "#F4F2EA",
}
DEFAULT_GRADE = {"bloom": 0.05, "vignette": 0.30, "grain": 0.05, "warmth": 0.0, "accent": 0.08}


class SpecError(Exception):
    pass


def num(x):
    """A TS numeric literal, short and exact enough."""
    if isinstance(x, bool):
        raise SpecError("expected a number, got a boolean")
    if isinstance(x, int):
        return str(x)
    if not isinstance(x, float) or not math.isfinite(x):
        raise SpecError(f"expected a finite number, got {x!r}")
    s = f"{x:.4f}".rstrip("0").rstrip(".")
    return s if s not in ("-0", "") else "0"


def frames(seconds):
    return int(round(float(seconds) * FPS))


# --------------------------------------------------------------------------- the library
def registry():
    """Component name -> list of module paths (relative to src, no extension) that export it."""
    reg = {}
    pat = re.compile(r"^export\s+(?:const|function)\s+([A-Z][A-Za-z0-9_]*)\b", re.M)
    for path in sorted(LIB.glob("*.tsx")):
        for m in pat.finditer(path.read_text()):
            reg.setdefault(m.group(1), []).append(f"./lib/{path.stem}")
    return reg


def sfx_kinds():
    kinds = set()
    for p in (REPO / "assets" / "sfx").glob("*.wav"):
        kinds.add(re.sub(r"(_v\d+)?$", "", p.stem))
    return kinds


# --------------------------------------------------------------------------- inputs
def load_json(path, what):
    try:
        return json.loads(Path(path).read_text())
    except FileNotFoundError:
        raise SpecError(f"{what} not found at {path}")
    except ValueError as exc:
        raise SpecError(f"{what} at {path} is not valid JSON ({exc})")


def norm_word(w):
    return re.sub(r"[^a-z0-9'&.]", "", w.lower()).strip(".")


def load_inputs(spec_path, out_dir):
    spec = load_json(spec_path, "the scene spec")
    board = load_json(out_dir / "storyboard.json", "storyboard.json")
    lines = load_json(out_dir / "vo_lines.json", "vo_lines.json")["lines"]
    words_doc = load_json(out_dir / "audio" / "words.json", "audio/words.json (the voice pipeline's word timings)")
    words = words_doc["words"] if isinstance(words_doc, dict) else words_doc
    claims_doc = load_json(out_dir / "claims.json", "claims.json")
    claims = claims_doc["claims"] if isinstance(claims_doc, dict) else claims_doc
    # the word timings must spell the current narration, or every word anchor is a lie
    said = [norm_word(w["w"]) for w in words if norm_word(w["w"])]
    script = [norm_word(t) for L in sorted(lines, key=lambda x: x["idx"]) for t in L["text"].split() if norm_word(t)]
    agree = difflib.SequenceMatcher(a=said, b=script, autojunk=False).ratio()
    if agree < 0.85:
        raise SpecError(f"audio/words.json does not spell the current vo_lines.json (agreement "
                        f"{agree:.0%}). It belongs to a different take or a different film. Re-run "
                        f"the voice pipeline's alignment before compiling.")
    return spec, board, lines, words, claims


def claim_strings(claims):
    """claim id -> on_screen string, plus 'id/1', 'id/2' for on_screen_also entries."""
    out = {}
    for c in claims:
        if c.get("status", "VERIFIED") not in ("VERIFIED", "verified", "LABELED", "labeled"):
            continue
        if c.get("on_screen"):
            out[c["id"]] = c["on_screen"]
        for i, s in enumerate(c.get("on_screen_also") or [], start=1):
            out[f"{c['id']}/{i}"] = s
    return out


def house_rules(text):
    bad = [why for ch, why in BANNED if ch in text]
    if re.search(r"\bcannot\b", text, re.I):
        bad.append('"cannot" (write "can\'t")')
    return bad


# --------------------------------------------------------------------------- compile context
class Compiler:
    def __init__(self, spec, board, lines, words, claims, out_dir, spec_path):
        self.spec, self.board, self.out_dir, self.spec_path = spec, board, out_dir, spec_path
        self.lines = sorted(lines, key=lambda x: x["idx"])
        self.words = words
        self.claims = claim_strings(claims)
        self.claim_texts = set(self.claims.values())
        self.errors, self.warnings = [], []
        self.reg = registry()
        self.imports = {}
        self.raw_ts = 0
        self.palette = dict(DEFAULT_PALETTE)
        self.palette.update(spec.get("palette") or {})
        self.grade = dict(DEFAULT_GRADE)
        self.grade.update(spec.get("grade") or {})
        self.run_date = spec.get("run_date") or board.get("run_date")
        if not self.run_date or not re.match(r"^\d{4}-\d{2}-\d{2}$", str(self.run_date)):
            raise SpecError("the spec needs run_date (YYYY-MM-DD), or the storyboard must carry one")
        mmdd = self.run_date[5:7] + self.run_date[8:10]
        self.episode = spec.get("episode") or f"Ep{mmdd}"
        self.comp = spec.get("composition") or f"Dispatch{mmdd}"
        if not re.match(r"^Ep[0-9A-Za-z]+$", self.episode) or not re.match(r"^Dispatch[0-9A-Za-z]+$", self.comp):
            raise SpecError("episode must look like Ep1003 and composition like Dispatch1003")
        self.beats = {b["id"]: b for b in board.get("beats") or []}
        starts = {L["idx"]: L["start"] for L in self.lines}
        from build_scenes import scene_start_times, TAIL
        try:
            shot_starts = scene_start_times(board, starts)
        except ValueError as exc:
            raise SpecError(f"storyboard shots do not resolve against vo_lines.json ({exc})")
        last_end = max(L["end"] for L in self.lines) + TAIL
        self.bounds = [(a, shot_starts[i + 1] if i + 1 < len(shot_starts) else last_end)
                       for i, a in enumerate(shot_starts)]
        self.board_shots = board.get("shots") or []
        self.beat_shot = {}
        ids = [s.get("id") for s in self.board_shots]
        for b in board.get("beats") or []:
            sid = b.get("shot")
            if sid in ids:
                self.beat_shot[b["id"]] = ids.index(sid)
        self.bound = {}           # shot index -> set of beat ids an action is timed to
        self.plate_boxes = []     # (shot, start_s, end_s, box, text, path)
        self.snaps = 0
        self.palette_used = set()
        self.segments = {}        # (shot, claim string) -> middot segments painted

    # ---- errors
    def err(self, path, msg):
        self.errors.append(f"{path}: {msg}")

    def warn(self, path, msg):
        self.warnings.append(f"{path}: {msg}")

    # ---- anchors
    def word_time(self, word, nth, si, path):
        lo, hi = self.bounds[si]
        target = norm_word(word)
        inside = [w for w in self.words if norm_word(w["w"]) == target and lo - 0.05 <= w["s"] < hi]
        if len(inside) >= nth:
            return inside[nth - 1]["s"]
        anywhere = [round(w["s"], 2) for w in self.words if norm_word(w["w"]) == target]
        hint = f" It is spoken at {anywhere} s." if anywhere else " It is never spoken."
        self.err(path, f'"{word}" #{nth} is not spoken inside shot {si + 1} ({lo:.2f} to {hi:.2f} s).{hint}')
        return lo

    def anchor(self, a, si, path, beat_ok=True):
        """-> (absolute seconds, TS frame expression in the shot's local timeline)."""
        lo, hi = self.bounds[si]
        if isinstance(a, (int, float)) and not isinstance(a, bool):
            secs, expr = float(a), None
        elif isinstance(a, str):
            m = ANCHOR_RE.match(a.strip())
            if not m:
                self.err(path, f"anchor {a!r} is not one of s, s+0.4, e-0.5, b:3, b:3+0.2, L:4, w:word, w:word#2, t:37.4")
                return lo, "0"
            off = float(m.group("off") or 0)
            if m.group("s") is not None:
                return lo + off, num(frames(off))
            if m.group("e") is not None:
                return hi + off, f"dur - {frames(-off)}" if off else "dur"
            if m.group("b") is not None:
                bid = int(m.group("b"))
                beat = self.beats.get(bid)
                if beat is None:
                    self.err(path, f"beat {bid} is not in the storyboard")
                    return lo, "0"
                if beat_ok:
                    self.bound.setdefault(si, set()).add(bid)
                home = self.beat_shot.get(bid)
                if home is not None and home != si:
                    self.err(path, f"beat {bid} belongs to shot {home + 1} on the board, not shot {si + 1}. "
                                   f"Move this action into shot {home + 1}, or refile the beat on the board.")
                secs = float(beat.get("at_s") if beat.get("at_s") is not None else _beat_t(beat)) + off
                expr = f"at({bid})" + (f" + {frames(off)}" if off > 0 else f" - {frames(-off)}" if off < 0 else "")
                self._inside(secs, si, path, a)
                return secs, expr
            if m.group("L") is not None:
                idx = int(m.group("L"))
                line = next((L for L in self.lines if L["idx"] == idx), None)
                if line is None:
                    self.err(path, f"VO line {idx} does not exist (0 to {len(self.lines) - 1})")
                    return lo, "0"
                secs = line["start"] + off
                expr = f"lAt({idx})" + (f" + {frames(off)}" if off > 0 else f" - {frames(-off)}" if off < 0 else "")
                self._inside(secs, si, path, a)
                return secs, expr
            if m.group("w") is not None:
                secs = self.word_time(m.group("w"), int(m.group("n") or 1), si, path) + off
            else:
                secs = float(m.group("t")) + off
        else:
            self.err(path, f"anchor must be a string or seconds, got {a!r}")
            return lo, "0"
        self._inside(secs, si, path, a)
        return secs, f"tAt({num(round(secs, 3))})"

    def _inside(self, secs, si, path, a):
        lo, hi = self.bounds[si]
        if not (lo - 0.5 <= secs <= hi + 0.25):
            self.err(path, f"anchor {a!r} resolves to {secs:.2f} s, outside shot {si + 1} ({lo:.2f} to "
                           f"{hi:.2f} s), so nothing timed to it is ever seen")

    # ---- values
    def value(self, v, si, path):
        if isinstance(v, bool):
            return "true" if v else "false"
        if v is None:
            return "undefined"
        if isinstance(v, (int, float)):
            return num(v)
        if isinstance(v, str):
            return json.dumps(v, ensure_ascii=False)
        if isinstance(v, list):
            return "[" + ", ".join(self.value(x, si, f"{path}[{i}]") for i, x in enumerate(v)) + "]"
        if not isinstance(v, dict):
            self.err(path, f"unsupported value {v!r}")
            return "0"
        ops = set(v) - {"init"}
        if len(ops) != 1:
            self.err(path, f"a value object takes exactly one operator, got {sorted(v)}. Wrap a literal object as {{\"lit\": ...}}")
            return "0"
        op = next(iter(ops))
        arg = v[op]

        def A(i, default=None):
            return arg[i] if isinstance(arg, list) and len(arg) > i else default

        if op == "lit":
            return json.dumps(arg, ensure_ascii=False)
        if op == "$":
            table = {"f": "f", "g": "(from + f)", "dur": "dur", "acc": "acc", "talk": "voice.opennessAt(from + f)"}
            if arg not in table:
                self.err(path, f"$ takes one of {sorted(table)}")
                return "0"
            return table[arg]
        if op == "color":
            if arg not in self.palette:
                self.err(path, f"palette has no color {arg!r} (it has {sorted(self.palette)})")
                return '"#FF00FF"'
            self.palette_used.add(arg)
            return f"PAL.{arg}" if re.match(r"^[A-Za-z_]\w*$", arg) else f"PAL[{json.dumps(arg)}]"
        if op == "ts":
            self.raw_ts += 1
            if not isinstance(arg, str) or not arg.strip():
                self.err(path, "ts takes a TypeScript expression string")
                return "0"
            return f"({arg})"
        if op in ("add", "mul"):
            if not isinstance(arg, list) or len(arg) < 2:
                self.err(path, f"{op} takes a list of two or more values")
                return "0"
            j = " + " if op == "add" else " * "
            return "(" + j.join(self.value(x, si, f"{path}.{op}[{i}]") for i, x in enumerate(arg)) + ")"
        if not isinstance(arg, list) or not arg:
            self.err(path, f"{op} takes a list of arguments")
            return "0"
        if op in ("ease", "spring", "bump"):
            _, a = self.anchor(A(0), si, f"{path}.{op}[0]")
            d = frames(A(1, 0.8 if op == "ease" else 0.67 if op == "spring" else 0.4))
            if op == "bump":
                return f"bump(f, {a}, {d}, {self.value(A(2, 1), si, path)})"
            return f"{op}(f, {a}, {d}, {self.value(A(2, 0), si, path)}, {self.value(A(3, 1), si, path)})"
        if op == "settle":
            _, a = self.anchor(A(0), si, f"{path}.settle[0]")
            preset = A(1, "pop")
            if preset not in ("pop", "snap", "settle"):
                self.err(path, "settle preset is pop, snap or settle")
            return f"settle(f, {a}, '{preset}', {self.value(A(2, 0), si, path)}, {self.value(A(3, 1), si, path)})"
        if op == "lin":
            _, a = self.anchor(A(0), si, f"{path}.lin[0]")
            _, b = self.anchor(A(1), si, f"{path}.lin[1]")
            return f"lin(f, {a}, {b}, {self.value(A(2, 0), si, path)}, {self.value(A(3, 1), si, path)})"
        if op == "ramp":
            _, a = self.anchor(A(0), si, f"{path}.ramp[0]")
            _, b = self.anchor(A(1), si, f"{path}.ramp[1]")
            return f"ramp(f, {a}, {b}, {self.value(A(2, 0), si, path)}, {self.value(A(3, 1), si, path)})"
        if op == "steps":
            pts = []
            for i, pt in enumerate(arg):
                if not isinstance(pt, list) or len(pt) != 2:
                    self.err(f"{path}.steps[{i}]", "each step is [anchor, value]")
                    continue
                _, a = self.anchor(pt[0], si, f"{path}.steps[{i}][0]")
                pts.append(f"[{a}, {self.value(pt[1], si, path)}]")
            init = self.value(v.get("init", 0), si, path)
            return f"steps(f, {init}, [{', '.join(pts)}])"
        if op == "wobble":
            _, a = self.anchor(A(0), si, f"{path}.wobble[0]")
            return f"wobble(f, {a}, {num(A(1, 3))}, {frames(A(2, 0.53))}, {num(A(3, 2.6))})"
        if op == "osc":
            return f"osc(f, {frames(A(0, 2.0))}, {num(A(1, 1))}, {num(A(2, 0))})"
        if op == "typed":
            _, a = self.anchor(A(0), si, f"{path}.typed[0]")
            text = A(1, "")
            for why in house_rules(str(text)):
                self.err(path, f"typed text {text!r} has {why}")
            return f"typed(f, {a}, {json.dumps(text, ensure_ascii=False)}, {num(A(2, 16))})"
        self.err(path, f"unknown value operator {op!r}")
        return "0"

    # ---- JSX
    def visible(self, v, path):
        """A string prop that reads as words a viewer sees is held to the house rules."""
        vals = v if isinstance(v, list) else [v]
        for x in vals:
            if isinstance(x, str) and not x.startswith("#") and (" " in x or re.search(r"[A-Z]{3}", x)):
                for why in house_rules(x):
                    self.err(path, f"visible text {x!r} has {why}")

    def attr(self, name, v, si, path):
        if not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", name):
            self.err(path, f"prop name {name!r} is not a valid identifier")
        self.visible(v, f"{path}.{name}")
        if isinstance(v, str) and '"' not in v and "\\" not in v and "\n" not in v and "{" not in v:
            return f'{name}="{v}"'
        return f"{name}={{{self.value(v, si, f'{path}.{name}')}}}"

    def component(self, use, path):
        if use.startswith("svg:"):
            tag = use[4:]
            if tag not in SVG_TAGS:
                self.err(path, f"svg:{tag} is not one of {sorted(SVG_TAGS)}")
            return tag
        mod_hint, _, name = use.rpartition(":")
        mods = self.reg.get(name)
        if not mods:
            close = difflib.get_close_matches(name, list(self.reg), n=4)
            self.err(path, f"no library component named {name!r}" + (f". Did you mean {close}?" if close else
                           ". Build it as a reusable component in video-engine/src/lib/ first."))
            return name
        if mod_hint:
            want = f"./lib/{mod_hint}"
            if want not in mods:
                self.err(path, f"{name} is not exported by lib/{mod_hint}.tsx (it is in {mods})")
                return name
            mod = want
        elif len(mods) > 1:
            self.err(path, f"{name} is exported by more than one module {mods}. Write \"module:{name}\".")
            return name
        else:
            mod = mods[0]
        self.imports.setdefault(mod, set()).add(name)
        return name

    def layer(self, L, si, path, depth):
        pad = "  " * depth
        if not isinstance(L, dict) or "use" not in L:
            self.err(path, "a layer needs `use`")
            return ""
        known = {"id", "use", "props", "children", "content", "x", "y", "at", "scale", "rot", "opacity", "z", "ox",
                 "oy", "enter", "exit", "idle", "shadow", "blur", "beats", "note", "when", "raw"}
        for k in L:
            if k not in known:
                self.err(f"{path}.{k}", f"unknown layer key (known: {sorted(known)})")
        tag = self.component(L["use"], f"{path}.use")
        props = L.get("props") or {}
        attrs = [self.attr(k, v, si, f"{path}.props") for k, v in props.items()]
        children = L.get("children") or []
        inner_parts = []
        if "content" in L:
            if tag != "text":
                self.err(path, "content is only for svg:text")
            c = L["content"]
            if isinstance(c, str):
                for why in house_rules(c):
                    self.err(f"{path}.content", f"visible text {c!r} has {why}")
            inner_parts.append("{" + self.value(c, si, f"{path}.content") + "}")
        for i, ch in enumerate(children):
            inner_parts.append(self.layer(ch, si, f"{path}.children[{i}]", depth + 2))
        open_tag = f"<{tag}{(' ' + ' '.join(attrs)) if attrs else ''}"
        if inner_parts:
            el = f"{open_tag}>\n" + "\n".join(f"{pad}    {p.strip()}" if not p.startswith(pad) else p for p in inner_parts) + f"\n{pad}  </{tag}>"
        else:
            el = f"{open_tag} />"
        for b in L.get("beats") or []:
            if b not in self.beats:
                self.err(f"{path}.beats", f"beat {b} is not in the storyboard")
            else:
                self.bound.setdefault(si, set()).add(b)
                home = self.beat_shot.get(b)
                if home is not None and home != si:
                    self.err(f"{path}.beats", f"beat {b} belongs to shot {home + 1} on the board, not shot {si + 1}")
        # the staging wrapper
        w = []
        at = L.get("at")
        if at is not None:
            if not (isinstance(at, list) and len(at) == 2):
                self.err(f"{path}.at", "at is [x, y]")
            else:
                w += [f"x={{{self.value(at[0], si, path + '.at[0]')}}}", f"y={{{self.value(at[1], si, path + '.at[1]')}}}"]
        for k in ("x", "y", "scale", "rot", "opacity", "z", "ox", "oy", "blur"):
            if k in L:
                w.append(f"{k}={{{self.value(L[k], si, f'{path}.{k}')}}}")
        if "enter" in L:
            w.append(f"enter={{{self.motion(L['enter'], ENTER, si, f'{path}.enter', 0.47, 220)}}}")
        if "exit" in L:
            w.append(f"exit={{{self.motion(L['exit'], EXIT, si, f'{path}.exit', 0.4, 260)}}}")
        if "idle" in L:
            w.append(f"idle={{{self.idle(L['idle'], f'{path}.idle')}}}")
        if "shadow" in L:
            sh = L["shadow"]
            if not isinstance(sh, dict) or "rx" not in sh:
                self.err(f"{path}.shadow", "shadow is {rx, ry?, dx?, dy?, opacity?}")
            else:
                w.append("shadow={{" + ", ".join(f"{k}: {num(sh[k])}" for k in ("rx", "ry", "dx", "dy", "opacity") if k in sh) + "}}")
        out = f"{pad}<Layer f={{f}}{(' ' + ' '.join(w)) if w else ''}>\n{pad}  {el}\n{pad}</Layer>"
        when = L.get("when")
        if when is not None:
            if not (isinstance(when, list) and len(when) == 2):
                self.err(f"{path}.when", "when is [anchor from, anchor until]")
            else:
                _, a = self.anchor(when[0], si, f"{path}.when[0]", beat_ok=False)
                _, b = self.anchor(when[1], si, f"{path}.when[1]", beat_ok=False)
                out = f"{pad}{{f >= {a} && f < {b} && (\n{out}\n{pad})}}"
        return out

    def motion(self, m, allowed, si, path, dflt_dur, dflt_dist):
        if isinstance(m, str):
            m = {"style": m}
        if not isinstance(m, dict) or m.get("style") not in allowed:
            self.err(path, f"style is one of {sorted(allowed)}")
            return "{style: 'none', at: 0}"
        _, a = self.anchor(m.get("at", "s"), si, f"{path}.at")
        parts = [f"style: '{m['style']}'", f"at: {a}", f"dur: {frames(m.get('dur', dflt_dur))}"]
        if "dist" in m or m["style"] not in ("fade", "pop", "grow", "unfold", "shrink", "none"):
            parts.append(f"dist: {num(m.get('dist', dflt_dist))}")
        return "{" + ", ".join(parts) + "}"

    def idle(self, i, path):
        if isinstance(i, str):
            i = {"kind": i}
        if not isinstance(i, dict) or i.get("kind") not in IDLE:
            self.err(path, f"idle kind is one of {sorted(IDLE)}")
            return "{kind: 'none'}"
        parts = [f"kind: '{i['kind']}'"]
        for k in ("amp", "phase"):
            if k in i:
                parts.append(f"{k}: {num(i[k])}")
        if "period" in i:
            parts.append(f"period: {frames(i['period'])}")
        return "{" + ", ".join(parts) + "}"

    def plate(self, P, si, path):
        known = {"claim", "text", "x", "y", "size", "tone", "at", "out", "note"}
        for k in P:
            if k not in known:
                self.err(f"{path}.{k}", f"unknown plate key (known: {sorted(known)})")
        if P.get("claim") is not None:
            text = self.claims.get(P["claim"])
            if text is None:
                self.err(path, f"claim {P['claim']!r} has no verified on_screen string (ids: {sorted(self.claims)})")
                return ""
        else:
            text = P.get("text", "")
            if text not in self.claim_texts:
                whole = next((full for full in self.claim_texts if " \u00b7 " in full and text in full.split(" \u00b7 ")), None)
                if whole:
                    # one middot segment of a claim, which is legal only if every segment of that
                    # claim is painted in the same shot, so the whole claim is on screen
                    self.segments.setdefault((si, whole), set()).add(text)
                else:
                    self.err(path, f"plate text {text!r} is not a claims.json on_screen string. Every painted "
                                   f"string traces to the fact-check-safe set. Use {{\"claim\": \"cN\"}}.")
        for why in house_rules(text):
            self.err(path, f"plate text {text!r} has {why}")
        size = P.get("size", 34)
        x, y = P.get("x", 540), P.get("y")
        if not isinstance(y, (int, float)):
            self.err(path, "a plate needs a numeric y")
            return ""
        tone = P.get("tone", "dark")
        if tone not in PLATE_TONES:
            self.err(f"{path}.tone", f"tone is one of {sorted(PLATE_TONES)}")
        w = len(text) * size * MONO_ADV + PLATE_LS * max(0, len(text) - 1) + PLATE_PAD
        h = size + 30
        box = (x - w / 2, y - h / 2, x + w / 2, y + h / 2)
        if box[0] < SIDE or box[2] > 1080 - SIDE:
            self.err(path, f"plate {text!r} spans x {box[0]:.0f} to {box[2]:.0f}, outside the {SIDE}px side "
                           f"safe area. Shorten it, drop the size, or recentre it.")
        if box[1] < SQUARE_TOP or box[3] > SQUARE_BOT:
            self.err(path, f"plate {text!r} spans y {box[1]:.0f} to {box[3]:.0f}, outside the square crop "
                           f"({SQUARE_TOP} to {SQUARE_BOT}), so the LinkedIn cut loses it")
        if box[3] > CAPTION_TOP and box[1] < CAPTION_BOT:
            self.err(path, f"plate {text!r} spans y {box[1]:.0f} to {box[3]:.0f}, inside the caption band "
                           f"({CAPTION_TOP} to {CAPTION_BOT})")
        a_s, a = self.anchor(P.get("at", "s+0.15"), si, f"{path}.at")
        p = f"ease(f, {a}, 10)"
        lo, hi = self.bounds[si]
        end_s = hi
        if "out" in P:
            end_s, b = self.anchor(P["out"], si, f"{path}.out", beat_ok=False)
            p = f"{p} * (1 - ease(f, {b}, 8))"
        self.plate_boxes.append((si, a_s, end_s, box, text, path))
        lit = f'text="{text}"' if '"' not in text else f"text={{'{text}'}}"
        return (f"        <Plate {lit} x={{{num(x)}}} y={{{num(y)}}} size={{{num(size)}}} tone=\"{tone}\" "
                f"p={{{p}}} />")

    def fx(self, F, si, path):
        kind = F.get("kind")
        if kind not in FX_KINDS:
            self.err(f"{path}.kind", f"fx kind is one of {sorted(FX_KINDS)}")
            return ""
        parts = [f'kind="{kind}"']
        if kind != "motes":
            _, a = self.anchor(F.get("at", "s"), si, f"{path}.at")
            parts.append(f"at={{{a}}}")
            parts.append(f"dur={{{frames(F.get('dur', 0.47))}}}")
        for k in ("x", "y", "r", "tx", "ty", "count", "y0", "y1", "opacity"):
            if k in F:
                parts.append(f"{k}={{{num(F[k])}}}")
        if "color" in F:
            c = F["color"]
            parts.append(f"color={{{self.value({'color': c} if isinstance(c, str) and not c.startswith('#') else c, si, path)}}}")
        return f"        <Fx f={{f}} {' '.join(parts)} />"

    def camera(self, C, si, path):
        C = C or {}
        push = C.get("push", [1.0, 1.06])
        if not (isinstance(push, list) and len(push) == 2):
            self.err(f"{path}.push", "push is [from, to]")
            push = [1.0, 1.06]
        if push[0] == push[1]:
            self.warn(f"{path}.push", "a held shot with no push is a static frame, which the craft rules ban")
        parts = [f"push: [{num(push[0])}, {num(push[1])}]", f"drift: {num(C.get('drift', 5))}"]
        snaps = []
        for i, s in enumerate(C.get("snaps") or []):
            self.snaps += 1
            _, a = self.anchor(s.get("at"), si, f"{path}.snaps[{i}].at")
            sp = [f"at: {a}", f"x: {num(s.get('x', 540))}", f"y: {num(s.get('y', 960))}",
                  f"zoom: {num(s.get('zoom', 1.6))}", f"dur: {frames(s.get('dur', 0.4))}",
                  f"hold: {frames(s.get('hold', 0.67))}", f"release: {frames(s.get('release', 0))}"]
            if s.get("lines") is False:
                sp.append("lines: false")
            snaps.append("{" + ", ".join(sp) + "}")
        if snaps:
            parts.append(f"snaps: [{', '.join(snaps)}]")
        shakes = []
        for i, s in enumerate(C.get("shakes") or []):
            _, a = self.anchor(s.get("at"), si, f"{path}.shakes[{i}].at")
            shakes.append(f"{{at: {a}, px: {num(s.get('px', 3))}, dur: {frames(s.get('dur', 0.33))}}}")
        if shakes:
            parts.append(f"shakes: [{', '.join(shakes)}]")
        return "{" + ", ".join(parts) + "}"

    def transition(self, T, si, path):
        if not T:
            return "{kind: 'cut'}"
        if isinstance(T, str):
            T = {"kind": T}
        kind = T.get("kind", "cut")
        if kind not in TRANSITIONS:
            self.err(f"{path}.kind", f"transition is one of {sorted(TRANSITIONS)}")
            kind = "cut"
        parts = [f"kind: '{kind}'", f"dur: {frames(T.get('dur', 0.3))}"]
        for k in ("x", "y"):
            if k in T:
                parts.append(f"{k}: {num(T[k])}")
        if "color" in T:
            parts.append(f"color: {self.value({'color': T['color']} if not str(T['color']).startswith('#') else T['color'], si, path)}")
        return "{" + ", ".join(parts) + "}"

    # ---- whole shots
    def shot(self, S, si):
        path = f"shots[{si}]"
        known = {"id", "note", "world", "layers", "plates", "fx", "camera", "transition", "grade"}
        for k in S:
            if k not in known:
                self.err(f"{path}.{k}", f"unknown shot key (known: {sorted(known)})")
        layers = list(S.get("layers") or [])
        if S.get("world"):
            w = dict(S["world"])
            w.setdefault("z", 0)
            layers.insert(0, w)
        if not layers:
            self.err(path, "a shot with no layers draws nothing")
        body = [self.layer(L, si, f"{path}.layers[{i}]", 4) for i, L in enumerate(layers)]
        body += [x for x in (self.fx(F, si, f"{path}.fx[{i}]") for i, F in enumerate(S.get("fx") or [])) if x]
        plates = [x for x in (self.plate(P, si, f"{path}.plates[{i}]") for i, P in enumerate(S.get("plates") or [])) if x]
        grade = dict(self.grade)
        grade.update(S.get("grade") or {})
        lo, hi = self.bounds[si]
        board = self.board_shots[si] if si < len(self.board_shots) else {}
        head = (f"    // S{si + 1} · {board.get('framing', '')} · {lo:.2f} to {hi:.2f} s"
                + (f" · {S['note']}" if S.get("note") else ""))
        g = ", ".join(f"{k}: {num(float(grade[k]))}" for k in ("bloom", "vignette", "grain", "warmth", "accent"))
        lines = [head,
                 f"    cam = {self.camera(S.get('camera'), si, f'{path}.camera')};",
                 f"    tin = {self.transition(S.get('transition'), si, f'{path}.transition')};",
                 f"    grade = {{{g}}};",
                 "    picture = (",
                 "      <SVG>",
                 *body,
                 "      </SVG>",
                 "    );"]
        if plates:
            lines += ["    plates = (", "      <SVG>", *plates, "      </SVG>", "    );"]
        return "\n".join(lines)

    # ---- episode checks
    def check_beats(self):
        for si in range(len(self.board_shots)):
            mine = sorted(b for b, s in self.beat_shot.items() if s == si)
            missing = [b for b in mine if b not in self.bound.get(si, set())]
            for b in missing:
                d = self.beats[b].get("draw") or {}
                self.err(f"shots[{si}]", f"beat {b} ({d.get('subject', '')}: {d.get('action', '')}) has no "
                                         f"action timed to it. Anchor the layer, plate, effect or camera move "
                                         f"that performs it to \"b:{b}\".")

    def check_segments(self):
        for (si, whole), have in self.segments.items():
            parts = whole.split(" \u00b7 ")
            missing = [p for p in parts if p not in have]
            if missing:
                self.err(f"shots[{si}].plates", f"plates show part of the claim {whole!r} without {missing}. "
                                                f"A claim split across plates must be painted whole in its shot.")

    def check_plates(self):
        for i, (si, a0, a1, b, t, p) in enumerate(self.plate_boxes):
            for sj, c0, c1, c, u, q in self.plate_boxes[i + 1:]:
                if si != sj or a1 <= c0 or c1 <= a0:
                    continue
                gap = 8
                if b[0] < c[2] + gap and c[0] < b[2] + gap and b[1] < c[3] + gap and c[1] < b[3] + gap:
                    self.err(p, f"plate {t!r} and plate {u!r} ({q}) share pixels while both are visible")

    def check_sound(self):
        sound = self.spec.get("sound")
        if sound is None:
            return None
        kinds = sfx_kinds()
        perf, prev, risers = [], None, 0
        for b in sorted(self.beats):
            s = sound.get(str(b))
            path = f"sound.{b}"
            if not isinstance(s, dict):
                self.err(path, "every beat needs a sound {kind, class, pan, role} once `sound` is given")
                continue
            kind, cls, pan = s.get("kind"), s.get("class", "standard"), s.get("pan", 0.0)
            if kind not in kinds:
                self.err(path, f"sound kind {kind!r} is not in the foley bank ({sorted(kinds)})")
            if cls not in SOUND_CLASSES:
                self.err(path, f"class is one of {sorted(SOUND_CLASSES)}")
            if not isinstance(pan, (int, float)) or abs(pan) > MAX_PAN:
                self.err(path, f"pan is a number within +/-{MAX_PAN}")
            if kind == prev:
                self.err(path, f"two consecutive beats on {kind!r}. The mix refuses repeats back to back.")
            risers += kind == "riser"
            prev = kind
            perf.append([kind, cls, pan, s.get("role", "")])
        if risers > 1:
            self.err("sound", f"{risers} risers. The mix allows one per episode.")
        return perf

    def strips(self):
        out = []
        for name, s in (self.spec.get("strips") or {}).items():
            bid = s.get("beat") if isinstance(s, dict) else None
            if bid not in self.beats:
                self.err(f"strips.{name}", "each strip is {beat, offset} on a storyboard beat")
                continue
            out.append([name, bid, float(s.get("offset", 0.2))])
        return out

    def bed(self):
        arc = []
        for i, pt in enumerate(self.spec.get("bed") or []):
            if not (isinstance(pt, list) and len(pt) == 2):
                self.err(f"bed[{i}]", "each bed point is [anchor, multiplier]")
                continue
            secs = self._abs(pt[0], f"bed[{i}]")
            arc.append([round(secs, 3), float(pt[1])])
        return arc

    def _abs(self, a, path):
        """An anchor's absolute seconds without a shot (bed automation spans the film)."""
        m = ANCHOR_RE.match(str(a))
        if isinstance(a, (int, float)):
            return float(a)
        if m and m.group("L") is not None:
            line = next((L for L in self.lines if L["idx"] == int(m.group("L"))), None)
            if line:
                return line["start"] + float(m.group("off") or 0)
        if m and m.group("b") is not None and int(m.group("b")) in self.beats:
            beat = self.beats[int(m.group("b"))]
            return float(beat.get("at_s") if beat.get("at_s") is not None else _beat_t(beat)) + float(m.group("off") or 0)
        if m and m.group("t") is not None:
            return float(m.group("t")) + float(m.group("off") or 0)
        self.err(path, f"a film-wide anchor is L:k, b:k, t:seconds or seconds, got {a!r}")
        return 0.0

    def compile(self):
        shots = self.spec.get("shots")
        if not isinstance(shots, list) or not shots:
            raise SpecError("the spec has no shots")
        if len(shots) != len(self.board_shots):
            self.err("shots", f"the spec has {len(shots)} shots and the storyboard has {len(self.board_shots)}. "
                              f"One spec shot per board shot, in order.")
        branches = []
        for si, S in enumerate(shots[:len(self.bounds)]):
            branches.append(self.shot(S, si))
        self.check_beats()
        self.check_plates()
        self.check_segments()
        if self.snaps > 2:
            self.warn("camera", f"{self.snaps} snap-zooms. The craft rule is one or two per episode, at the "
                                f"moments that matter most.")
        perf = self.check_sound()
        moves = self.strips()
        arc = self.bed()
        return branches, perf, moves, arc


def _beat_t(beat):
    raw = str(beat.get("t", "0")).lower().replace(" to ", "-")
    m = re.search(r"\d+(?:\.\d+)?", raw)
    return float(m.group(0)) if m else 0.0


# --------------------------------------------------------------------------- emit
def inputs_hash(spec_path, out_dir):
    h = hashlib.sha256(f"scene_compile v{COMPILER_VERSION}\n".encode())
    for p in (spec_path, out_dir / "storyboard.json", out_dir / "vo_lines.json", out_dir / "audio" / "words.json",
              out_dir / "claims.json", Path(__file__)):
        h.update(Path(p).read_bytes())
    return h.hexdigest()[:20]


def emit(c, branches, digest):
    ep, schema = c.episode, c.episode[0].lower() + c.episode[1:] + "Schema"
    imports = [f"import {{{', '.join(sorted(names))}}} from '{mod}';" for mod, names in sorted(c.imports.items())
               if mod != "./lib/scene"]
    def key(k):
        return k if re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", k) else json.dumps(k)

    pal = ",\n  ".join(key(k) + ": " + json.dumps(v) for k, v in c.palette.items())
    chain = []
    for i, b in enumerate(branches, start=1):
        chain.append(("  if (n === 1) {\n" if i == 1 else f"  }} else if (n === {i}) {{\n") + b + "\n")
    chain_src = "".join(chain) + "  }\n" if chain else ""
    title = (c.spec.get("title") or c.board.get("title") or c.comp).replace("*/", "")
    return f"""// GENERATED by scripts/scene_compile.py from {os.path.relpath(c.spec_path, REPO)}. DO NOT EDIT.
// Edit the scene spec and recompile. A hand edit here is overwritten by the next compile and
// `scene_compile.py --check` fails the run until it is. scene-inputs: {digest}
// {title} ({c.run_date}). Every painted string is a claims.json on_screen string.
import React from 'react';
import {{AbsoluteFill, Sequence, staticFile, useCurrentFrame}} from 'remotion';
import {{z}} from 'zod';
import {{GradeLayer}} from './lib/lighting';
import {{VoiceProvider, useVoice}} from './lib/voice';
import {{EndCredits}} from './lib/EndCredits';
import {{assertCropSafe}} from './lib/cropsafe';
import {{CameraRig, Fx, Layer, Snap, Shake, TransitionIn, TransitionKind, bump, ease, lin, osc, ramp, settle, spring, steps, typed, wobble}} from './lib/scene';
{chr(10).join(imports)}

const W = 1080, H = 1920;
const MONO = 'JetBrains Mono, monospace';
type Beat = {{id: number; at: number; label: string}};
const PAL = {{
  {pal},
}};
void [bump, lin, osc, ramp, settle, spring, steps, typed, wobble, H];

const SVG: React.FC<{{children: React.ReactNode}}> = ({{children}}) => (
  <svg width={{W}} height={{H}} viewBox="0 0 1080 1920" style={{{{position: 'absolute', inset: 0, overflow: 'visible'}}}}>{{children}}</svg>
);

const plateW = (text: string, size: number, ls = 1.5) =>
  text.length * size * 0.602 + ls * Math.max(0, text.length - 1) + 56;

const Plate: React.FC<{{text: string; x?: number; y: number; size?: number; tone?: 'dark' | 'paper' | 'accent'; p?: number}}> =
({{text, x = 540, y, size = 30, tone = 'dark', p = 1}}) => {{
  const w = plateW(text, size), h = size + 30;
  assertCropSafe(text, y - h / 2, y + h / 2);
  const fill = tone === 'paper' ? PAL.paper : tone === 'accent' ? PAL.accent : PAL.plate;
  const edge = tone === 'paper' ? PAL.paperEdge : tone === 'accent' ? PAL.accentEdge : PAL.plateEdge;
  const k = Math.max(0, Math.min(1, p));
  if (k <= 0.01) return null;
  return (
    <g opacity={{k}} transform={{`translate(${{x}} ${{y}}) scale(${{0.94 + 0.06 * k}})`}}>
      <rect x={{-w / 2 + 6}} y={{-h / 2 + 7}} width={{w}} height={{h}} rx={{7}} fill={{PAL.ink}} opacity={{0.5}} />
      <rect x={{-w / 2}} y={{-h / 2}} width={{w}} height={{h}} rx={{7}} fill={{fill}} stroke={{edge}} strokeWidth={{3.5}} />
      <text x={{0}} y={{size * 0.36}} textAnchor="middle" fontFamily={{MONO}} fontWeight={{700}}
        fontSize={{size}} letterSpacing={{1.5}} fill={{edge}}>{{text}}</text>
    </g>
  );
}};

const Captions: React.FC<{{cues: {{t: number; d: number; text: string}}[]}}> = ({{cues}}) => {{
  const t = useCurrentFrame() / 30;
  const c = cues.find((x) => t >= x.t && t < x.t + x.d);
  if (!c) return null;
  const words = c.text.split(' ');
  const rows: string[] = [];
  let row = '';
  for (const w of words) {{
    if ((row + ' ' + w).trim().length > 34 && row) {{ rows.push(row); row = w; }} else row = (row + ' ' + w).trim();
  }}
  if (row) rows.push(row);
  // NEVER DROP A ROW: a caption that renders most of a sentence and drops the end is a false
  // statement on screen. The bar fits whatever it is handed.
  const fs = rows.length >= 4 ? 27 : rows.length === 3 ? 32 : 39;
  const step = rows.length >= 4 ? 30 : rows.length === 3 ? 37 : 49;
  const y0 = rows.length === 1 ? 1420 : rows.length === 2 ? 1390 : rows.length === 3 ? 1378 : 1366;
  return (
    <SVG>
      <rect x={{68}} y={{1336}} width={{944}} height={{136}} rx={{16}} fill={{PAL.captionBg}} stroke={{PAL.captionEdge}} strokeWidth={{3}} opacity={{0.96}} />
      {{rows.map((s, i) => (
        <text key={{i}} x={{540}} y={{y0 + i * step}} textAnchor="middle" fontFamily={{MONO}} fontWeight={{700}} fontSize={{fs}} fill={{PAL.captionText}}>{{s}}</text>
      ))}}
    </SVG>
  );
}};

type Cam = {{push?: [number, number]; drift?: number; snaps?: Snap[]; shakes?: Shake[]}};
type Tin = {{kind?: TransitionKind; dur?: number; x?: number; y?: number; color?: string}};

const Shot: React.FC<{{n: number; from: number; dur: number; beats: Beat[]; lines: number[]}}> = ({{n, from, dur, beats, lines}}) => {{
  const f = useCurrentFrame();
  const voice = useVoice();
  const at = (id: number) => {{
    const b = beats.find((x) => x.id === id);
    return b ? b.at * 30 - from : 0;
  }};
  const lAt = (i: number) => (lines[i] ?? 0) * 30 - from;
  const tAt = (s: number) => s * 30 - from;
  const acc = voice.accentAt ? voice.accentAt(from + f) : 0;
  void [at, lAt, tAt, acc];
  let picture: React.ReactNode = null;
  let plates: React.ReactNode = null;
  let cam: Cam = {{}};
  let tin: Tin = {{kind: 'cut'}};
  let grade = {{bloom: 0.05, vignette: 0.3, grain: 0.05, warmth: 0, accent: 0.08}};

{chain_src}
  return (
    <AbsoluteFill>
      <TransitionIn f={{f}} {{...tin}}>
        <CameraRig f={{f}} dur={{dur}} {{...cam}}>{{picture}}</CameraRig>
        {{plates}}
      </TransitionIn>
      <GradeLayer f={{f}} bloom={{grade.bloom + acc * grade.accent}} vignette={{grade.vignette}} grain={{grade.grain}} warmth={{grade.warmth}} />
    </AbsoluteFill>
  );
}};

const captions = z.array(z.object({{t: z.number(), d: z.number(), text: z.string()}}));

export const {schema} = z.object({{
  captions: captions.default([]),
  scenes: z.array(z.object({{from: z.number(), dur: z.number()}})).optional(),
  total: z.number().optional(),
  lines: z.array(z.number()).optional(),
  beats: z.array(z.object({{id: z.number(), at: z.number(), label: z.string()}})).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({{frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()}})).optional(),
  credits: z.object({{music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}}).optional(),
}});
type Props = z.infer<typeof {schema}>;

const FontStyles = () => (
  <style>{{`@font-face{{font-family:Fraunces;src:url('${{staticFile('fonts/Fraunces-Var.ttf')}}') format('truetype');font-weight:100 900;font-display:block;}}@font-face{{font-family:'JetBrains Mono';src:url('${{staticFile('fonts/JetBrainsMono-Bold.ttf')}}') format('truetype');font-weight:100 900;font-display:block;}}`}}</style>
);

export const {ep}: React.FC<Props> = ({{captions: cues = [], scenes, beats, lines, credits, mouth = [], accents = []}}) => {{
  const slots = scenes ?? [];
  const end = slots.length ? slots[slots.length - 1].from + slots[slots.length - 1].dur : 0;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{{{fps: 30, mouth, accents}}}}>
      <AbsoluteFill style={{{{backgroundColor: PAL.bg}}}}>
        <FontStyles />
        {{slots.map((s, i) => (
          <Sequence key={{i}} from={{s.from}} durationInFrames={{s.dur}} name={{`S${{i + 1}}`}}>
            <Shot n={{i + 1}} from={{s.from}} dur={{s.dur}} beats={{bs}} lines={{lines ?? []}} />
          </Sequence>
        ))}}
        <Sequence from={{0}} durationInFrames={{Math.max(1, end)}}><Captions cues={{cues}} /></Sequence>
        {{credits && (
          <Sequence name="CREDITS" from={{end}} durationInFrames={{credits.frames}}>
            <EndCredits data={{credits}} durationInFrames={{credits.frames}} />
          </Sequence>
        )}}
      </AbsoluteFill>
    </VoiceProvider>
  );
}};
"""


def register(c, root_path):
    """Add the episode to Root.tsx once. Idempotent; never touches another episode's entry."""
    src = root_path.read_text()
    if f'id="{c.comp}"' in src:
        return False
    schema = c.episode[0].lower() + c.episode[1:] + "Schema"
    imp = f"import {{{c.episode}, {schema}}} from './{c.episode}';\n"
    last = list(re.finditer(r"^import \{[^}]*\} from '\./Ep[^']*';\n", src, re.M))
    if last:
        pos = last[-1].end()
    else:
        imps = list(re.finditer(r"^import .*;\n", src, re.M))
        pos = imps[-1].end() if imps else 0
    src = src[:pos] + imp + src[pos:]
    block = (f'      <Composition id="{c.comp}"\n'
             f"        component={{{c.episode}}} durationInFrames={{3900}}\n"
             f"        fps={{30}} width={{1080}} height={{1920}} schema={{{schema}}} defaultProps={{{{captions: []}}}}\n"
             f"        calculateMetadata={{({{props}}) => ({{durationInFrames: (props as {{total?: number}}).total ?? 3900}})}} />\n")
    first = src.find('      <Composition id="Dispatch')
    if first < 0:
        raise SpecError("Root.tsx has no Dispatch composition to register beside")
    src = src[:first] + block + src[first:]
    root_path.write_text(src)
    return True


def main(argv=None):
    ap = argparse.ArgumentParser(description="compile out/dispatch/scene_spec.json into an episode")
    ap.add_argument("--spec", default=None)
    ap.add_argument("--out-dir", default=str(OUT), help="where storyboard, vo_lines, claims and audio/words live")
    ap.add_argument("--src-dir", default=str(SRC), help="where the episode file and Root.tsx live")
    ap.add_argument("--check", action="store_true", help="validate, and fail if the episode is stale")
    ap.add_argument("--assets", nargs="?", const="", default=None, help="list library components")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args(argv)
    if a.self_test:
        return self_test()
    if a.assets is not None:
        reg = registry()
        names = sorted(n for n in reg if a.assets.lower() in n.lower())
        for n in names:
            print(f"{n:28s} {', '.join(m.replace('./lib/', 'lib/') for m in reg[n])}")
        print(f"{len(names)} component(s)")
        return 0
    out_dir = Path(a.out_dir)
    spec_path = Path(a.spec) if a.spec else out_dir / "scene_spec.json"
    src_dir = Path(a.src_dir)
    try:
        spec, board, lines, words, claims = load_inputs(spec_path, out_dir)
        c = Compiler(spec, board, lines, words, claims, out_dir, spec_path)
        branches, perf, moves, arc = c.compile()
    except SpecError as exc:
        print(f"scene_compile: {exc}")
        return 1
    for w in c.warnings:
        print(f"  WARN  {w}")
    if c.errors:
        for e in c.errors:
            print(f"  FAIL  {e}")
        print(f"scene_compile: {len(c.errors)} problem(s) in {spec_path.name}. Nothing was written.")
        return 1
    digest = inputs_hash(spec_path, out_dir)
    target = src_dir / f"{c.episode}.tsx"
    if a.check:
        head = target.read_text().split("\n", 3)[:3] if target.exists() else []
        if not any(f"scene-inputs: {digest}" in h for h in head):
            print(f"scene_compile: {target.name} is STALE or missing against the spec and its inputs. "
                  f"Run python3 scripts/scene_compile.py.")
            return 1
        print(f"scene_compile: {target.name} is current, the spec is valid")
        return 0
    tsx = emit(c, branches, digest)
    target.write_text(tsx)
    registered = register(c, src_dir / "Root.tsx")
    events = {"run_date": c.run_date, "composition": c.comp, "episode": c.episode, "inputs": digest,
              "performance": perf, "moves": moves, "bed_arc": arc}
    (out_dir / "scene_events.json").write_text(json.dumps(events, indent=1) + "\n")
    n_layers = sum(len(S.get("layers") or []) + (1 if S.get("world") else 0) for S in spec["shots"])
    n_beats = sum(len(v) for v in c.bound.values())
    print(f"scene_compile: wrote {target.relative_to(REPO) if target.is_relative_to(REPO) else target} "
          f"({len(tsx):,} bytes from a {spec_path.stat().st_size:,} byte spec): {len(branches)} shots, "
          f"{n_layers} layers, {len(c.plate_boxes)} plates, {n_beats}/{len(c.beats)} beats timed"
          f"{', registered ' + c.comp + ' in Root.tsx' if registered else ''}"
          f"{f', {c.raw_ts} raw ts expression(s)' if c.raw_ts else ''}")
    return 0


# --------------------------------------------------------------------------- self-test
def self_test():
    import tempfile
    scratch = REPO / "out" / "tmp"
    scratch.mkdir(parents=True, exist_ok=True)
    checks = []
    with tempfile.TemporaryDirectory(dir=scratch) as tmp:
        d = Path(tmp)
        (d / "audio").mkdir()
        lines = [{"idx": 0, "text": "A hunter asked Google about snipe.", "start": 0.0, "end": 3.0},
                 {"idx": 1, "text": "The answer was wrong.", "start": 3.2, "end": 5.0}]
        words = [{"w": w, "s": round(i * 0.45, 2), "e": round(i * 0.45 + 0.4, 2)} for i, w in
                 enumerate("A hunter asked Google about snipe. The answer was wrong.".split())]
        words[6]["s"], words[7]["s"], words[8]["s"], words[9]["s"] = 3.2, 3.6, 4.1, 4.5
        board = {"run_date": "2026-01-02", "title": "T",
                 "shots": [{"id": 1, "vo_line": 0, "framing": "macro"}, {"id": 2, "vo_line": 1, "framing": "wide"}],
                 "beats": [{"id": 1, "shot": 1, "at_s": 0.5, "draw": {"subject": "a thumb", "action": "taps"}},
                           {"id": 2, "shot": 2, "at_s": 3.4, "draw": {"subject": "a card", "action": "slams"}}]}
        claims = {"claims": [{"id": "c1", "status": "VERIFIED", "on_screen": "SEASON BEGAN SEPT 1"},
                             {"id": "c2", "status": "VERIFIED", "on_screen": "SAME SEARCH · SAME ANSWER"}]}
        for name, obj in (("vo_lines.json", {"lines": lines}), ("storyboard.json", board), ("claims.json", claims)):
            (d / name).write_text(json.dumps(obj))
        (d / "audio" / "words.json").write_text(json.dumps({"words": words}))
        (d / "src").mkdir()
        (d / "src" / "Root.tsx").write_text("import {Ep0101, ep0101Schema} from './Ep0101';\nexport const R = () => (\n  <>\n"
                                            '      <Composition id="Dispatch0101" />\n  </>\n);\n')
        good = {"run_date": "2026-01-02", "shots": [
            {"layers": [{"use": "svg:rect", "props": {"width": 1080, "height": 1920, "fill": {"color": "bg"}}, "z": 0},
                        {"use": "svg:circle", "props": {"r": 40}, "at": [540, 900], "enter": {"style": "pop", "at": "b:1"}}],
             "plates": [{"claim": "c1", "y": 600, "at": "w:snipe"}]},
            {"camera": {"snaps": [{"at": "b:2", "x": 540, "y": 900}]},
             "transition": "whip-left",
             "layers": [{"use": "svg:rect", "props": {"width": 400, "height": 200}, "at": [340, 800],
                         "enter": {"style": "slam", "at": "b:2"}, "shadow": {"rx": 200}}],
             "plates": [{"claim": "c2", "y": 1200, "at": "w:answer"}]}],
            "sound": {"1": {"kind": "tick", "pan": 0.1}, "2": {"kind": "snap", "class": "hero"}},
            "strips": {"the_card_slamming": {"beat": 2, "offset": 0.2}}}

        def run(spec):
            (d / "scene_spec.json").write_text(json.dumps(spec))
            import io
            import contextlib
            buf = io.StringIO()
            with contextlib.redirect_stdout(buf):
                code = main(["--out-dir", str(d), "--src-dir", str(d / "src")])
            return code, buf.getvalue()

        code, out = run(good)
        checks.append((code == 0, f"a valid spec compiles ({out.strip().splitlines()[-1] if out.strip() else ''})"))
        tsx = (d / "src" / "Ep0102.tsx").read_text() if (d / "src" / "Ep0102.tsx").exists() else ""
        checks.append(("if (n === 1) {" in tsx and "} else if (n === 2) {" in tsx and "let picture: React.ReactNode" in tsx,
                       "the episode is a single-router Shot the gates already parse"))
        checks.append(("at(2)" in tsx and "at(1)" in tsx, "beat anchors compile to at(id), which the beat-to-shot gates read"))
        checks.append(('text="SEASON BEGAN SEPT 1"' in tsx, "a plate carries its claim string literally"))
        checks.append(('id="Dispatch0102"' in (d / "src" / "Root.tsx").read_text(), "the composition is registered"))
        ev = json.loads((d / "scene_events.json").read_text())
        checks.append((ev["performance"][1][0] == "snap" and ev["moves"] == [["the_card_slamming", 2, 0.2]],
                       "sound and evidence moves are written for the mixer and the evidence pack"))
        code, out = run(good)
        checks.append((main(["--out-dir", str(d), "--src-dir", str(d / "src"), "--check"]) == 0, "--check passes on a fresh compile"))
        split = json.loads(json.dumps(good))
        split["shots"][1]["plates"] = [{"text": "SAME SEARCH", "y": 1100, "at": "w:answer"}, {"text": "SAME ANSWER", "y": 1200, "at": "w:answer"}]
        code, out = run(split)
        checks.append((code == 0, "a claim split at its middot is legal when the whole claim is painted"))

        def broken(mut):
            s = json.loads(json.dumps(good))
            mut(s)
            return run(s)

        cases = [
            (lambda s: s["shots"][0]["layers"][1]["enter"].update(at="b:2"), "belongs to shot 2", "a beat timed in the wrong shot"),
            (lambda s: (s["shots"][1]["layers"][0].pop("enter"), s["shots"][1].pop("camera")), "has no action timed to it", "a board beat nothing animates"),
            (lambda s: s["shots"][0]["plates"][0].update(claim=None, text="SEASON OPENS SOON"), "not a claims.json", "a plate string outside the claims"),
            (lambda s: s["shots"][0]["plates"][0].update(y=1400), "caption band", "a plate in the caption band"),
            (lambda s: s["shots"][0]["plates"][0].update(y=430), "square crop", "a plate across the square crop"),
            (lambda s: s["shots"][0]["plates"][0].update(x=900), "side safe area", "a plate off the side"),
            (lambda s: s["shots"][1]["plates"].append({"claim": "c2", "y": 1210}), "share pixels", "two plates overlapping"),
            (lambda s: s["shots"][0]["layers"][1].update(use="NoSuchWidget"), "no library component", "an unknown asset"),
            (lambda s: s["shots"][0]["plates"][0].update(at="w:hunter#2"), "is not spoken inside shot 1", "a word anchor that never happens there"),
            (lambda s: s["shots"][0]["plates"][0].update(at="b:9"), "not in the storyboard", "a beat that does not exist"),
            (lambda s: s["sound"].update({"2": {"kind": "tick"}}), "two consecutive beats", "the same sound twice in a row"),
            (lambda s: s["sound"].update({"2": {"kind": "kazoo"}}), "not in the foley bank", "a sound the bank lacks"),
            (lambda s: s["shots"][0]["layers"].append({"use": "svg:text", "content": "Note: this"}), "a colon", "visible text with a colon"),
            (lambda s: s["shots"][1]["plates"].__setitem__(0, {"text": "SAME SEARCH", "y": 1200}), "without ['SAME ANSWER']", "half a claim split across plates"),
            (lambda s: s["shots"][0]["layers"].append({"use": "svg:g", "props": {"aria-label": 1}}), "not a valid identifier", "a prop name that is not an identifier"),
            (lambda s: s["shots"][0]["layers"][1]["props"].update(title="WE CANNOT SAY"), "cannot", "visible prop text with cannot"),
        ]
        for mut, needle, what in cases:
            code, out = broken(mut)
            checks.append((code == 1 and needle in out, f"refuses {what}"))
        good2 = json.loads(json.dumps(good))
        (d / "scene_spec.json").write_text(json.dumps(good2))
        main(["--out-dir", str(d), "--src-dir", str(d / "src")])
        spec2 = json.loads((d / "scene_spec.json").read_text())
        spec2["shots"][0]["plates"][0]["y"] = 640
        (d / "scene_spec.json").write_text(json.dumps(spec2))
        import io
        import contextlib
        with contextlib.redirect_stdout(io.StringIO()):
            stale = main(["--out-dir", str(d), "--src-dir", str(d / "src"), "--check"])
        checks.append((stale == 1, "--check fails when the spec changed after the last compile"))
        bad_words = [{"w": w, "s": i * 0.4} for i, w in enumerate("The Air Force wants a base".split())]
        (d / "audio" / "words.json").write_text(json.dumps({"words": bad_words}))
        with contextlib.redirect_stdout(io.StringIO()) as buf:
            code = main(["--out-dir", str(d), "--src-dir", str(d / "src")])
        checks.append((code == 1, "refuses word timings that spell a different film"))
    for ok, msg in checks:
        print(("ok   " if ok else "FAIL ") + msg)
    if not all(ok for ok, _ in checks):
        return 1
    print("scene_compile self-test passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
