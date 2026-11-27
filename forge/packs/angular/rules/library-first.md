# Library-first (angular)

Search the repo **and** verify APIs from **installed** sources before inventing helpers or deps.

## Rules

1. Ripgrep for existing facades, utils, pipes, wrappers — **extend** before creating.
2. New **npm** dependency only with explicit task DoD or human approval.
3. Prefer design-system / shared UI wrappers over raw third-party primitives.
4. When using an external lib already in `package.json`: read its types/README under `node_modules` (or docs URL) — **never** guess APIs from training data.
5. Cite the reused canonical path (and verified API notes) in task `notes.md`.

## Blockers

- Parallel DTO/mapper logic in two domains without a shared owner
- UI importing stores directly (bypass facade)
- New package without search note in handoff
