# September 12th Dispatch

Owner directive is to execute `prompts/dispatch_routine.md` from current main, deliver the finished Dispatch, save an unsent Gmail draft, publish the feed, push a ready PR and merge after all gates pass. Never disclose the Gemini key. Source base is `4598e95` and run branch is `claude/dispatch-2026-09-12`.

| Phase | State |
| --- | --- |
| Refresh and authoritative reads | Done. No queued story. Run stamped. |
| Environment and research | Done. Setup passes with retired GPU stack optional. Three researchers returned fresh primary sources. |
| Fact check, angle, directors room, Gate 0 | Independent fact check and dedupe pass. The Question Comes First angle locked. Four-pitch writers room active. |
| Voice and complete rough cut | Next |
| Craft passes, objective gates and panel | Next |
| Retrospective fixes and delivery | Next |
| Ready PR, CI, merge, live feed and Gmail draft readback | Next |

The existing `tmp/` is unrelated and remains untouched. Prior scratch under `out/dispatch` is stale unless regenerated after the run stamp. Do not edit rendered source after final evidence without rerendering.

Upgrade commit `623c95f` skips retired GPU setup by default, removes automatic narration time-stretch and isolates the runtime self-test from a later stage-variety rule. Setup, byte compilation and format self-test pass.
