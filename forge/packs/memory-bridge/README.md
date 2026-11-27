# Pack: memory-bridge (opt-in, yellow)

Optional adapters that **export/import** Forge Markdown continuity into third-party memory tools.  
**Not the core.** Daily path stays `epics/memory.md` + `_next-task-prompt.md` (`artefacts.md`).

## When to enable

- Enterprise already runs **claude-mem**, **mem0**, or similar and wants a documented bridge
- You accept that external DBs are **yellow**: secrets surface, sync drift, non-portable across harnesses

## When NOT to enable

- Greenfield / MD-only teams — skip; Forge continuity is enough
- You need hard guarantees of what the model “knows” — prefer versioned artefacts in git

## Contents

| Path | Role |
|------|------|
| `rules/memory-bridge.md` | Contract: precedence, export/import **workflow**, forbidden list |
| `adapters/COMPATIBILITY.md` | Per-tool export/import paths (claude-mem / mem0 / none) |
| `adapters/export-sketch.md` | Digest shape (≤80 lines; no diffs/secrets) |

## Enable

Add `memory-bridge` under `packs.enabled` in `forge/project.md`. No installer binary — follow `rules/memory-bridge.md`.
