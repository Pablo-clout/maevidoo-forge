# Decisions journal

> **Dated snapshots — not live documentation.** Each entry describes the code **as of its date**. The code may have changed since.
> Before relying on an entry: check the code it names. If they disagree, **the code wins** — mark the entry `superseded <date>` (or delete it) instead of following it.
> Newest first. Written by Scrum at task close; working files (handoffs, reviews, sketches, evidence) are deleted once their entry exists.
> Template → copy to `epics/decisions.md`.

<!-- One entry per closed task, ≤15 lines not counting Follow-ups. At feature close, merge that feature's task entries into one entry, ≤25 lines.
     Keep only what a future reader cannot recover from the code or the commit message: the why, the rejected paths, the open ends. -->

## {{YYYY-MM-DD}} — {{feature}} / {{task-id}} — {{title}}

- **As of:** {{YYYY-MM-DD}} · commit `{{sha}}` · status: current <!-- or: superseded YYYY-MM-DD by <entry or commit> -->
- **Run:** <!-- command (forge | forge-light | pilot | debug) · ceremony · judged: no | light | testers | review | full · loaded: <files of task.md § Load> · assumptions made without asking, or "none" -->
- **What shipped:** <!-- 2–4 lines: behaviour delivered and how the flow works end to end -->
- **Decisions:**
  - <!-- decision — why (the constraint or trade-off behind it) -->
- **Rejected / failed:** <!-- approach — why it was dropped, so nobody retries it blind; "none" if none -->
- **Follow-ups (code):** <!-- unresolved Medium/Low findings an agent can fix — short clauses on one line; "none" if none -->
- **Follow-ups (human):** <!-- decisions only the human can take (scope added, retention, design gaps); "none" if none -->
- **Where:** <!-- main code paths touched -->
