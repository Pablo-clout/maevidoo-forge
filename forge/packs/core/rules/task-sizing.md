# Rule: task sizing

How `/forge` decides how many tasks a request becomes. **Default: one task.**

**Why it matters:** every task pays a fixed cost — a Code agent, a Review agent, often a Quality pass with lenses, a human Go to read, and a set of files. Many small tasks multiply that cost without adding quality, and the human can no longer follow the plan. Past runs split one change into three tasks, then coded and reviewed them in a single pass anyway: the split was paperwork.

## What a task is

One slice of behaviour that:

- **one Code agent implements in one pass**, and
- **one reviewer judges from one diff**, and
- has **at least one acceptance criterion of its own**, verifiable without the other tasks.

A task is a deliverable, not an activity.

## Split only when one of these is true

| Reason to split | Example |
|-----------------|---------|
| The diff would be too large to review well (roughly >400 changed lines or >10 files) | New domain: store + facade, then the screens that use it |
| A real dependency boundary: B cannot start until A is merged, and A is useful alone | API contract first, then the client |
| Different risk needs a different ceremony | A migration (governed) next to a label change (lite) |
| The human asked for that split | Keep it as stated — do not reinvent it |

## Do not split

- **By activity** — "implement", "write tests", "QA", "docs" are steps inside one task, never tasks.
- **By layer for its own sake** — tokens / component / page of the same screen is one task unless the diff size rule applies.
- **By file** or by checklist item.
- To make a plan look thorough.

## Merge test (run before the Go gate)

For each pair of planned tasks, ask:

1. Would they be coded in the same pass or reviewed from the same diff? → **merge**.
2. Does one of them have no acceptance criterion of its own? → **fold it into the other** as a DoD line.
3. Would a reviewer need task B's diff to judge task A? → **merge**.

## Counts

- Most requests: **1 task**. A feature: **1–4 tasks**.
- More than 5 tasks → the scope is probably two features. Say so and ask the human (`forge/packs/core/rules/asking.md`) instead of producing a long list.
- Record the reasoning in one line in `feature.md` Notes (`sizing: 2 tasks — API contract precedes client`).
