# Library-first (java)

Search the repo **and** verify APIs from **installed** sources before inventing utilities or Maven deps.

## Rules

1. Ripgrep for existing services, utils, mappers — **extend** before creating.
2. New **Maven** dependency only with explicit task DoD or human approval.
3. Prefer Spring / JDK utilities already on the classpath over new libs.
4. When using an external artifact already in `pom.xml`: read sources/Javadoc for the **resolved version** — never guess APIs.
5. Cite reused path + verified API notes in task `notes.md`.

## Blockers

- Duplicate money/rounding helpers without a shared owner
- New dependency without search note in handoff
- Business module pulling web-only libraries
