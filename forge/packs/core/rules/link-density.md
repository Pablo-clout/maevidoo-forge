# Rule: link density

**Planning artefacts are read by humans first.** A reviewer must be able to gate a plan in **≤2 minutes of click-through** — and a cold agent (Orient, Code, a lens) must reach every source of truth from the files alone, without chat history. Concrete, resolvable references are the **product** of planning, not decoration.

## Trigger

Always good practice. **Mandatory** when ceremony is governed/strict with UI in scope, or whenever `visual_refs` exist.

## Contract

1. Every source of truth an artefact mentions is a **clickable reference**: a markdown link or a backticked repo-relative path that resolves in the IDE. "See the proposals folder" fails; a per-file list passes.
2. `feature.md` is the **hub**: links to SSOT files, brief(s), the cold-start doc, tokens/inventory docs if any, and each `tasks/<id>/task.md` in the task table (status + depends_on filled).
3. `task.md` `visual_refs` = explicit file list (visual-qa § SSOT lock) — never a bare folder when SSOT files exist.
4. Continuity files (`epics/memory.md`, `epics/_next-task-prompt.md`) point at the active feature/task **by path** — "what's next" is one click away.
5. Prefer listing concrete files over prose that mentions folders. A path that does not resolve is a defect — fix it at Scrum, don't ship it forward.

## Review test (use at the Go gate)

Open `feature.md`. Can you reach the brief, every SSOT ref, every task file, the cold-start doc, and the next-task pointer — by clicking only? If not, the plan is not gate-ready: fail density and fix before asking `Go`.

## Anti-goals

- Folder-only refs when files exist
- References to chat messages or ephemeral context as a source of truth
- Pasting whole file contents into artefacts instead of linking them
- Link lists padded with irrelevant files — density means *every needed file*, not *every file*
