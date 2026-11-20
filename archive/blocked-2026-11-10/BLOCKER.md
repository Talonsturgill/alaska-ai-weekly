# 2026-11-10 Dispatch: stopped at a hard blocker, no film

BLOCKER: the Gemini API key is out of prepaid credit. HTTP 402 RESOURCE_EXHAUSTED, "Your prepayment credits are depleted". It fails on the TTS call (scripts/vo_synth_gemini.py) and on a plain gemini-2.5-flash generateContent, so it is account-wide. Fix: top up at ai.studio/projects, then re-run. Everything here is reusable.

Fallback measured, not guessed: DISPATCH_VOICE=cloned under .venv-voice on this 4-core CPU-only container. One 4.7 s line took 307 s over 8 attempts and no candidate passed (best WER 0.50, similarity 0.9136 against a 0.92 floor). At that rate the 125 s read alone is about 2 hours and would still fail its own gates.

Done this run: story locked (DeepGreen subsea tidal AI data center, FERC P-15423, after the November 2nd objection deadline; a follow-up to the 2026-09-06 film, outside the 30 day window), 19 fact-checked claims, earned angle, four-lens directors room (winner "Take a Number", hero TakeANumberMachine, throughline the ticket), art direction, VO script (264 words, predicted 128 s) through Gates 0E and 0F, and the voice direction plan.
Not done: storyboard, scenes, VO audio, render, panel, caption, Gmail draft, publish, ledger entry. Nothing in ledger/state was changed.
