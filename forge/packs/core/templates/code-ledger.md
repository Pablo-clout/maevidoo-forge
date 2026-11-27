# Code ledger — {{area}} ({{project}})

> Template → `docs/code-ledger/<area>.md`: one file per area, plus `docs/code-ledger/shared.md` and `docs/code-ledger/whole.md`. What `/forge-code-sweep` found **in this area**, and what became of it. A task that works here reads this file and no other.
>
> **Two kinds of entry.**
> - **Important** (`open`): Critical, High, and the Mediums that need a real task or a decision. They are in the sweep's report, grouped in fix batches. The `status` line is yours: `accepted`, `declined` or `deferred`, with a word of why — or answer in chat and Forge writes it.
> - **Backlog** (`backlog`): the minor ones. Nobody has to read them. Each task that works in an area checks the backlog of that area before it hands over: what is no longer true is closed, what is still true in the code it just touched is fixed and closed.
>
> A finding you declined is not raised again, unless what its *reopens when* line says has happened.

## Important

### C-1 · {{severity}} — {{the finding, in one line}}
- kind: defect | debt | proposal · size: S | M | L
- where: <!-- path:line, every place -->
- check: <!-- the command, search or sequence that shows it — a task re-runs this to know whether it is still true -->
- status: open · batch B-1 <!-- open · backlog · accepted — to do · declined {{date}} — why · deferred until {{date or event}} · fixed {{commit}} · closed {{date}} — no longer true: why -->
- first seen: {{YYYY-MM-DD}} · last seen: {{YYYY-MM-DD}}
- reopens when: <!-- for a declined or deferred entry: what would make it worth raising again -->

## Backlog — cleaned up by the tasks that work here

### C-2 · Low — {{a minor finding}}
- kind: debt · size: S
- where:
- check:
- status: backlog
- first seen: {{YYYY-MM-DD}}
