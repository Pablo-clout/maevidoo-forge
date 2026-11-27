# To sweep — what shipped since the last sweep

> The queue `/forge-sweep` and `/forge-ux-sweep` read first. Every closed task adds one line here, whatever the command (`/forge`, `/forge-light`, `/forge-pilot`, `/forge-debug`). The sweeps test these **before anything else, in deep mode**, starting with what **no judge** looked at, then what only a light tester saw, then remove the lines they covered.
> Written and read with `node forge/packs/core/tools/sweep-queue.mjs` (`add`, `list`, `swept`), never by hand, so the format does not depend on the model. Template → copy to `epics/to-sweep.md`. Newest first. One line per closed task. The why and the decisions live in `epics/decisions.md` (same date and title).

<!-- judged: no        = nobody but the author checked it (lite, /forge-debug, /forge-light no-test) → sweep first, deepest
             light     = one short independent tester (/forge-light) → sweep next, deep: the tester had fifteen minutes
             testers   = flow test + UI review ran (standard, screen task)
             review    = diff review ran (standard, no screen)
             full      = governed: review + testers + lenses
     swept:  —  until a sweep covers it: `sweep <date> ok | n findings`, `ux <date> ok | n findings`.
             A line is removed once every sweep that applies has covered it: both when a screen changed, /forge-sweep alone otherwise. -->

| Date | Commit | What shipped (feature · screens or endpoints) | Mode | Judged | Check in particular | Swept |
|------|--------|-----------------------------------------------|------|--------|---------------------|-------|
| {{YYYY-MM-DD}} | `{{sha}}` | <!-- Lend an item · Gear list, Lend dialog --> | forge-light \| forge \| pilot \| debug | no \| light \| testers \| review \| full | <!-- the acceptance criteria in a few words, the assumptions made without asking, what the author could not check --> | — |
