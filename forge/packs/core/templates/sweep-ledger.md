# Sweep ledger — {{project}}

> What `/forge-sweep` and `/forge-ux-sweep` already looked at and settled. It keeps the next run from asking again or redoing it, and it says what reopens each entry. Rules: `forge/packs/core/rules/sweep-ledger.md`.
> Appended by the sweeps at close. **You** may edit any entry. Delete it to reopen the question; answer an `asked` entry by writing `decided: <your answer>`; add `deferred until <date>` to a defect you accept for now. Your edit wins.
> Newest first. Entry ids are never reused.

<!-- verdict: fixed (a guard — replayed every run) | polished (polish batch preferred by the blind A/B judge) | validated (judged, kept) | decided (human answer) | asked (question waiting for you)
              | deferred until YYYY-MM-DD (human only, defects) | declined (suggestion not taken)
     kind: defect | usability | judgement | polish | preference — a defect is never `validated`; an agent never writes `deferred` -->

## L-{{n}} · {{feature or screen}} · {{element}} · {{check}}
- kind: defect | usability | judgement | polish | preference
- verdict: <!-- see above --> · by: sweep | ux-sweep | human · {{YYYY-MM-DD}} · commit `{{sha}}`
- why: <!-- one line: what was fixed, decided or kept, and the reason; for `asked`, the question as it was put -->
- acceptance: <!-- the objective target that says it is right: "≥ 4.5:1 in every state", "gap 16px", "one loan after a double click" -->
- measured: <!-- the value at that moment — "worse than this" reopens it -->
- covered: <!-- viewports and states this verdict was taken on -->
- reproduce: <!-- for `fixed`: the steps, replayed first by every run -->
- capture: <!-- for `fixed`, when visible: the probe command (with --stable) -->
- reopen when: <!-- default: the element's code changed · measurement worse · state or viewport not covered · now High · review date {{YYYY-MM-DD + 12 months}} -->
- report: <!-- epics/sweeps/<date>.md#S-n -->
