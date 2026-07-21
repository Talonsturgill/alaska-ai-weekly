#!/usr/bin/env python3
"""BUILD THE SFX BANK — designed foley, not beeps.

The old mix synthesized every effect as a bare lavfi sine ("thud" = a 90 Hz
beep). This builds assets/sfx/<kind>.wav with actual sound design in numpy:

  impacts   = pitch-swept sub body + onset click + filtered noise shell
  metal     = inharmonic partial stacks (bell/clank physics) + transient
  whoosh    = pink noise through a swept band-pass with a doppler-ish arc
  creak     = accelerating stick-slip pulse train through a resonance
  paper     = crackle burst train, high-passed
  riser     = swept noise + a rising harmonic under it

Deterministic (seeded), 44.1k 16-bit stereo, peaks at -6 dBFS, gentle tanh
saturation for character. Run once; the bank is committed so every future run
mixes with the same designed sounds.

UPGRADE PATH FOR REAL RECORDINGS: if assets/sfx/real/<kind>.wav exists (a
curated CC0/PD recording, logged in assets/sfx/MANIFEST.md), it WINS over the
synth. scripts/sfx_bank.py resolves in that order. Drop better takes in over
time; nothing else changes.
"""
import os
import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, ".."))
BANK = os.path.join(REPO, "assets", "sfx")
rng = np.random.default_rng(49)  # deterministic bank


def t_axis(dur):
    return np.arange(int(SR * dur)) / SR


def env_exp(n, decay):
    return np.exp(-decay * np.arange(n) / SR)


def env_ar(n, attack_s, release_s):
    a = int(max(1, attack_s * SR)); r = int(max(1, release_s * SR))
    e = np.ones(n)
    e[:a] = np.linspace(0, 1, a)
    if r < n:
        e[-r:] *= np.linspace(1, 0, r)
    return e


def bp(x, lo, hi, order=4):
    sos = butter(order, [max(20, lo), min(SR / 2 - 100, hi)], btype="band", fs=SR, output="sos")
    return sosfilt(sos, x)


def lp(x, fc, order=4):
    sos = butter(order, min(SR / 2 - 100, fc), btype="low", fs=SR, output="sos")
    return sosfilt(sos, x)


def hp(x, fc, order=4):
    sos = butter(order, max(20, fc), btype="high", fs=SR, output="sos")
    return sosfilt(sos, x)


def noise(n):
    return rng.standard_normal(n)


def pink(n):
    # Voss-ish: sum of octave-spaced LP noise
    x = np.zeros(n)
    for oct_ in range(5):
        step = 2 ** oct_
        base = rng.standard_normal(n // step + 1)
        x += np.repeat(base, step)[:n]
    return x / 5


def sweep_sine(f0, f1, dur, curve=1.0):
    t = t_axis(dur)
    f = f0 + (f1 - f0) * (t / dur) ** curve
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph)


def partial_stack(f0, ratios, decays, dur, detune=0.002):
    t = t_axis(dur); x = np.zeros(t.size)
    for r, d in zip(ratios, decays):
        f = f0 * r * (1 + rng.uniform(-detune, detune))
        x += np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) * env_exp(t.size, d) / len(ratios)
    return x


def click(dur=0.006, fc=3000):
    return bp(noise(int(SR * dur)), fc * 0.5, fc * 2) * env_exp(int(SR * dur), 600)


def mix(*parts):
    n = max(p.size for p in parts)
    out = np.zeros(n)
    for p in parts:
        out[:p.size] += p
    return out


# ---------------------------------------------------------------- the designs
def d_thud():      # cartoon body-impact: sub sweep + knock + noise shell
    body = sweep_sine(130, 42, 0.32, 0.5) * env_exp(int(SR * 0.32), 11) * 1.0
    knock = lp(noise(int(SR * 0.05)), 900) * env_exp(int(SR * 0.05), 90) * 0.8
    shell = lp(noise(int(SR * 0.2)), 400) * env_exp(int(SR * 0.2), 22) * 0.35
    return mix(body, knock, shell)

def d_stamp():     # heavier: deeper sub + paper slap on top
    body = sweep_sine(100, 34, 0.42, 0.5) * env_exp(int(SR * 0.42), 8) * 1.1
    slap = bp(noise(int(SR * 0.04)), 700, 5000) * env_exp(int(SR * 0.04), 140) * 0.9
    return mix(body, slap)

def d_boom():      # scene-scale impact, longer bloom
    body = sweep_sine(90, 30, 0.9, 0.4) * env_exp(int(SR * 0.9), 4.2) * 1.1
    air = lp(pink(int(SR * 0.7)), 500) * env_exp(int(SR * 0.7), 6) * 0.5
    return mix(body, click(0.008, 1200) * 0.5, air)

def d_pop():       # bubble pop: fast chirp + tiny click
    chirp = sweep_sine(950, 340, 0.09, 1.6) * env_exp(int(SR * 0.09), 55)
    return mix(chirp, click(0.004, 4000) * 0.5)

def d_snap():      # finger snap: broadband crack + 90Hz bump
    crack = bp(noise(int(SR * 0.03)), 1500, 9000) * env_exp(int(SR * 0.03), 220) * 1.0
    bump = sweep_sine(160, 80, 0.07, 1) * env_exp(int(SR * 0.07), 60) * 0.5
    return mix(crack, bump)

def d_tick():      # clock tick: tight resonant click
    return bp(noise(int(SR * 0.012)), 1800, 5200) * env_exp(int(SR * 0.012), 420)

def d_ding():      # small bright bell: inharmonic partials, long tail
    return partial_stack(880, [1, 2.71, 4.07, 5.4], [3.2, 5.5, 8, 12], 1.1)

def d_chime():     # softer, warmer bell (win/positive accent)
    return partial_stack(660, [1, 2.0, 2.96, 4.1], [2.6, 4, 6, 9], 1.3)

def d_clank():     # struck metal: dense inharmonic stack + hard transient
    body = partial_stack(310, [1, 1.63, 2.29, 3.42, 4.8], [9, 12, 16, 22, 30], 0.5)
    return mix(click(0.005, 2500) * 0.9, body)

def d_chain():     # a handful of clank-lets, irregular
    out = np.zeros(int(SR * 0.5))
    tpos = 0.0
    for i in range(6):
        c = partial_stack(500 + rng.uniform(-80, 220), [1, 1.51, 2.3, 3.9], [18, 25, 32, 40], 0.16) * rng.uniform(0.4, 1.0)
        s = int(tpos * SR)
        out[s:s + c.size] += c[:max(0, out.size - s)]
        tpos += rng.uniform(0.03, 0.08)
    return out

def d_whoosh():    # air pass: pink noise through a swept band-pass, arc envelope
    n = int(SR * 0.55)
    x = pink(n)
    # three chunks with rising then falling center freq = doppler-ish
    segs = []
    for i, (lo, hi) in enumerate([(200, 900), (500, 2600), (300, 1200)]):
        seg = bp(x[i * n // 3:(i + 1) * n // 3], lo, hi)
        segs.append(seg)
    y = np.concatenate(segs)
    return y * env_ar(y.size, 0.12, 0.28)

def d_riser():     # build: swept noise + rising harmonic, crescendo
    n = int(SR * 0.95)
    nz = hp(pink(n), 300) * np.linspace(0.15, 1.0, n) ** 1.5
    tone = sweep_sine(180, 640, 0.95, 1.2) * np.linspace(0.1, 0.8, n) ** 1.4 * 0.6
    y = mix(bp(nz, 400, 5200), tone)
    return y * env_ar(y.size, 0.5, 0.06)

def d_creak():     # stick-slip: accelerating pulse train through a resonance
    n = int(SR * 0.5)
    out = np.zeros(n)
    tpos = 0.0; gap = 0.035
    while tpos < 0.42:
        c = click(0.005, 900) * rng.uniform(0.5, 1.0)
        s = int(tpos * SR)
        out[s:s + c.size] += c[:max(0, n - s)]
        gap *= 0.86  # accelerates = the creak "gives"
        tpos += max(0.006, gap + rng.uniform(-0.004, 0.004))
    return bp(out, 300, 2200) * env_ar(n, 0.02, 0.15)

def d_paper():     # rustle/crumple: crackle burst train, high-passed
    n = int(SR * 0.7)
    out = np.zeros(n)
    for _ in range(90):
        s = int(rng.uniform(0, 0.62) * SR)
        c = hp(noise(int(SR * rng.uniform(0.002, 0.007))), 1200) * rng.uniform(0.2, 1.0)
        out[s:s + c.size] += c[:max(0, n - s)]
    return out * env_ar(n, 0.05, 0.25) * 0.8

def d_paw():       # soft muffled footfall
    body = sweep_sine(190, 95, 0.09, 0.8) * env_exp(int(SR * 0.09), 45) * 0.7
    pad = lp(noise(int(SR * 0.06)), 600) * env_exp(int(SR * 0.06), 70) * 0.5
    return mix(body, pad)

def d_caw():        # raven call: two rasping downward caws (landing/commentary beat)
    def one_caw():
        n = int(SR * 0.14)
        tone = sweep_sine(950, 420, 0.14, 1.3) * env_ar(n, 0.01, 0.09) * 0.55
        rasp = bp(noise(n), 700, 3200) * env_ar(n, 0.008, 0.1) * 0.7
        return mix(tone, rasp)
    c1 = one_caw()
    gap = int(SR * 0.09)
    c2 = one_caw() * 0.8
    out = np.zeros(c1.size + gap + c2.size)
    out[:c1.size] += c1
    out[c1.size + gap:c1.size + gap + c2.size] += c2
    return out

def d_klaxon():    # two-tone alert, band-limited square-ish
    t = t_axis(0.5)
    f = np.where((t * 4).astype(int) % 2 == 0, 392.0, 311.0)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.tanh(1.8 * np.sin(ph)) * 0.8
    return lp(y, 2400) * env_ar(t.size, 0.02, 0.1)


DESIGNS = {
    "thud": d_thud, "stamp": d_stamp, "boom": d_boom, "pop": d_pop, "snap": d_snap,
    "tick": d_tick, "ding": d_ding, "chime": d_chime, "clank": d_clank, "chain": d_chain,
    "whoosh": d_whoosh, "riser": d_riser, "creak": d_creak, "paper": d_paper,
    "paw": d_paw, "klaxon": d_klaxon, "caw": d_caw,
}


def finish(x):
    """Character saturation, DC removal, normalize to -6 dBFS, edge fades, stereo."""
    x = np.tanh(1.25 * x / max(1e-9, np.max(np.abs(x))))
    x = hp(x, 28, order=2)                       # rumble cleanup
    x = x / max(1e-9, np.max(np.abs(x))) * 0.5   # -6 dBFS
    fade = int(SR * 0.004)
    x[:fade] *= np.linspace(0, 1, fade)
    x[-fade:] *= np.linspace(1, 0, fade)
    # subtle stereo: tiny decorrelated delay on the right channel
    d = int(SR * 0.0008)
    right = np.concatenate([np.zeros(d), x[:-d]]) if d else x
    return np.stack([x, 0.92 * right + 0.08 * x], axis=1)


def main():
    os.makedirs(BANK, exist_ok=True)
    from scipy.io import wavfile
    rows = []
    for kind, fn in DESIGNS.items():
        y = finish(fn())
        path = os.path.join(BANK, f"{kind}.wav")
        wavfile.write(path, SR, (y * 32767).astype(np.int16))
        dur = y.shape[0] / SR
        peak = float(np.max(np.abs(y)))
        rows.append((kind, dur, peak))
        print(f"  {kind:8} {dur:5.2f}s  peak {20*np.log10(peak):5.1f} dBFS")
    man = os.path.join(BANK, "MANIFEST.md")
    with open(man, "w") as f:
        f.write("# SFX bank — designed foley (scripts/build_sfx_library.py)\n\n")
        f.write("Deterministic numpy sound design (seeded), 44.1k/16-bit stereo, -6 dBFS peaks.\n")
        f.write("License: original synthesis, no third-party material.\n\n")
        f.write("To UPGRADE any entry with a real recording: put a curated CC0/public-domain\n")
        f.write("take at `assets/sfx/real/<kind>.wav` and log its source + license here.\n")
        f.write("scripts/sfx_bank.py prefers real/ over the synth bank automatically.\n\n")
        for kind, dur, peak in rows:
            f.write(f"- `{kind}.wav` — {dur:.2f}s — designed synth — no attribution needed\n")
    print(f"bank: {len(rows)} sounds -> {BANK}")


if __name__ == "__main__":
    main()
