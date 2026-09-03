#!/usr/bin/env python3
"""Check delivery-codec loudness before rendering video; never modify the PCM mix."""
import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess
import sys
import tempfile

CODEC_PARAMS = {"codec": "aac", "bitrate": "192k", "sample_rate_hz": 48000, "channels": 2}
METRIC_KEYS = ("input_i", "input_tp", "input_lra")


def validate_metrics(raw):
    """Existing delivery limits only. LRA is required evidence, not a new gate."""
    metrics = {}
    for key in METRIC_KEYS:
        try:
            value = raw[key]
            if isinstance(value, bool):
                raise ValueError("boolean is not a measurement")
            metrics[key] = float(value)
        except (KeyError, TypeError, ValueError, OverflowError) as exc:
            raise ValueError(f"missing or malformed loudnorm metric {key}") from exc
        if not math.isfinite(metrics[key]):
            raise ValueError(f"non-finite loudnorm metric {key}")
    errors = []
    if not -15 <= metrics["input_i"] <= -13:
        errors.append("integrated loudness must be within [-15, -13] LUFS")
    if metrics["input_tp"] > -1:
        errors.append("true peak must be <= -1 dBTP")
    return metrics, errors


def parse_loudnorm(stderr):
    candidates = []
    for match in re.finditer(r"\{[^{}]*\}", stderr, re.S):
        block = match.group(0)
        if not any(f'"{key}"' in block for key in METRIC_KEYS):
            continue
        try:
            candidates.append(json.loads(block))
        except ValueError as exc:
            raise ValueError("malformed loudnorm JSON") from exc
    if len(candidates) != 1:
        raise ValueError(f"expected one loudnorm metric object, found {len(candidates)}")
    return validate_metrics(candidates[0])


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def empty_report(wav):
    return {"wav": str(wav), "pcm_sha256": None, "codec_params": dict(CODEC_PARAMS),
            "metrics": None, "pass": False, "errors": ["AAC probe has not completed"]}


def check_audio(wav, ffmpeg="ffmpeg"):
    wav = Path(wav).resolve()
    report = empty_report(wav)
    report["errors"] = []
    try:
        report["pcm_sha256"] = sha256(wav)
        with tempfile.TemporaryDirectory(prefix="dispatch-aac-check-") as scratch:
            encoded = Path(scratch) / "probe.m4a"
            subprocess.run([ffmpeg, "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
                            "-i", str(wav), "-map", "0:a:0", "-vn", "-c:a", "aac",
                            "-b:a", "192k", "-ar", "48000", "-ac", "2", str(encoded)],
                           check=True, capture_output=True, text=True, timeout=180)
            measured = subprocess.run([ffmpeg, "-nostdin", "-hide_banner", "-i", str(encoded),
                                       "-map", "0:a:0", "-af",
                                       "loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json",
                                       "-f", "null", "-"],
                                      check=True, capture_output=True, text=True, timeout=180)
            report["metrics"], report["errors"] = parse_loudnorm(measured.stderr)
        if sha256(wav) != report["pcm_sha256"]:
            report["errors"].append("PCM input changed during the AAC probe")
        report["pass"] = not report["errors"]
    except subprocess.CalledProcessError as exc:
        report["errors"].append(f"ffmpeg exited {exc.returncode}: {(exc.stderr or '')[-2000:].strip()}")
    except (OSError, ValueError, subprocess.TimeoutExpired) as exc:
        report["errors"].append(str(exc))
    return report


def write_report(path, report):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w") as output:
        json.dump(report, output, indent=2, allow_nan=False)
        output.write("\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--wav", required=True)
    parser.add_argument("--report", required=True)
    args = parser.parse_args()
    wav, destination = Path(args.wav).resolve(), Path(args.report).resolve()
    try:
        if destination == wav or (destination.exists() and wav.exists() and destination.samefile(wav)):
            raise ValueError("report path must not overwrite the PCM input")
        # A killed/interrupted check must not leave yesterday's PASS at this path.
        write_report(destination, empty_report(wav))
        report = check_audio(wav)
        write_report(destination, report)
    except (OSError, ValueError) as exc:
        print(f"AAC check FAIL: {exc}", file=sys.stderr)
        return 1
    metrics = report["metrics"]
    score = (f"I {metrics['input_i']:.2f} LUFS; TP {metrics['input_tp']:.2f} dBTP; "
             f"LRA {metrics['input_lra']:.2f} LU") if metrics else "metrics unavailable"
    print(f"AAC check {'PASS' if report['pass'] else 'FAIL'}: {score} -> {destination}")
    for error in report["errors"]:
        print(f"  {error}", file=sys.stderr)
    return 0 if report["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
