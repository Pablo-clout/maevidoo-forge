# Rule: depends_on, parallel, and unattended queue

When a task or feature declares dependencies, **enforce order** — do not parallelize across missing commits.

## Fields (in task.md or feature.md frontmatter or YAML block)

```yaml
depends_on: []           # task ids or feature paths that must be done first
parallel_ok: false         # true only if domains are disjoint AND no depends_on
unattended: false          # true = human already Go'd a queue; see Unattended loop
```

## Rules

1. **`depends_on` non-empty** → `parallel_ok` must be `false`.
2. Before `/forge-pilot` on task B, verify every dependency shows **done** in the `feature.md` task table. Done task folders are deleted by Scrum — the proof is the table row plus the dated entry in `epics/decisions.md` (commit sha).
3. **Host worktrees** (where the host provides them): use only when `parallel_ok: true` and file domains do not overlap; Scrum still merges one at a time on main.
4. **Sequential features**: queue gated features; each starts from the branch/commit that includes its dependency — never three worktrees from the same base if F2 needs F1.

## Unattended loop (bounded night / queue run)

Opt-in sequential runner for **already-gated** tasks. Not a new skill — `/forge-pilot` feature-level mode.

** Preconditions**

- Human wrote an ordered queue (paths) in `_next-task-prompt.md` or `feature.md` under `## Unattended queue`
- Each item has Goal + DoD + prior **Go** (or queue header says `gate: pre-approved`)
- `unattended: true` on the feature **or** human message contains `unattended`

** Budgets (hard stop)**

| Cap | Limit |
|-----|-------|
| Tasks in one unattended session | **≤ 5** |
| Wall / hop budget | Honor `execution-contract.md` pilot caps per task |
| Review/Quality rounds per task | **3** (auto-debug shortcut applies) |
| Stop-on-fail | First **hard FAIL** after max rounds → stop queue; do **not** start next task |
| Push | **Never** |

** Procedure**

1. Read queue top → bottom; skip items already `status: done`.
2. For each: honor `depends_on` → run full pilot for that task → Scrum on main → refresh `_next-task-prompt.md`.
3. On stop-on-fail: write blocker path + reason into `_next-task-prompt.md` and `epics/memory.md`; end session.
4. Announce: `🧩 Unattended: task k/n — <id>`.

** Forbidden**

- Inventing Go for ungated work
- Parallel tasks across `depends_on`
- Continuing after Critical/High unresolved at round cap
- UI+refs with `min` / silent skip of qa-ux

## Failure mode

If dependency incomplete → stop pilot and tell the human which blocker to finish first.
