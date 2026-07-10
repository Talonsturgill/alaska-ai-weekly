# Dispatch 2026-07-10 — Teaching the Machine to See

**Story.** A pilot project on the Wood River (Bristol Bay) is testing whether an autonomous
"drone in the box" plus a machine-learning model can help count sockeye escapement — the number
that sets the season for the world's largest sockeye fishery, which Alaska has counted BY HAND from
riverbank towers for over 70 years. The fresh angle: the machine cannot count yet. A person has to
teach it first, hand-marking each fish that crosses a line, several thousand labels, before the model
can pick fish out on its own.

**Honest caveat (drawn, not captioned).** The model has NOT been tested against the ADF&G tower
counts (that check is the project's next phase), and a shadow on the river can still fool it. The
towers keep the count this summer. ADF&G runs the towers but is not a project partner.

**Composition fingerprint** (Gate 0A: differs 6/7 axes from EACH of the last 2 dispatches;
spatial signature unique vs last 4; palette fresh vs last 2):
- pov: macro-closeup · motion_vector: vertical-descent · hero_treatment: single-organic-hero
- layout: fullbleed-split · register: editorial-schematic
- palette: sockeye crimson, glacial pale-blue river, gravel sage, cedar, phosphor-yellow mark, charcoal
- metaphor: a person teaches the machine to see the run one fish at a time; until proven, the towers keep the record

**Structure.** 7 storyboard shots rendered as 8 (the long resolution splits into resolution +
map/outro so no shot exceeds 16s): wide-establish → subject-portrait → alt-vantage → data-panel →
push-detail → two-up → wide-establish → map-territory. 20 timed beats, gaps ≤2.5s, 23 SFX events
cut to the picture.

**Voice.** kokoro:af_bella — the roster's warm/bright PUBLISH voice, Apache-2.0 (commercial use OK,
no attribution required). The rendered audio was cut with it (audio/voice_used.json is the record).
A Gemini-TTS backend hook also sits in vo_teaching.py (preferred automatically if GEMINI_API_KEY is
ever set in the routine env). **Music.** "Reawakening" — Kevin MacLeod (incompetech.com), CC BY 4.0,
ducked under VO, −14.5 LUFS master.

**On-screen provenance note.** The escapement window 700,000 to 2,800,000 is ADF&G's Wood River
sockeye goal (tower count). The adjacent "PILOT · NOT AN ADFG PROJECT" tag disclaims the DRONE PILOT's
affiliation only, not the number's ADF&G provenance.

**Fact-check.** Two independent validators. Doubly-confirmed on-screen numerals only:
OVER 70 YEARS, 08:30, SEVERAL THOUSAND LABELS, 700,000 TO 2,800,000 (ADF&G), WORLD'S LARGEST SOCKEYE RUN.
Avoided as bare numerals (single-sourced): 1955, nine tower sites, 6.43M Wood River forecast.
"Rik Cumps" (in an early research draft) does not appear in the source and was cut.

**Cultural note.** Bristol Bay sockeye are the subsistence and economic backbone of the region's
Yup'ik, Alutiiq and Dena'ina communities. Framed as augmenting a stewarded tradition, not replacing
it. Aerial imagery over subsistence rivers raises data-governance questions the region's tribes and
CDQ organizations should be consulted on and compensated for.

**Sources.** See sources.json (KDLG primary; ADF&G + UW Alaska Salmon Program second sources).
