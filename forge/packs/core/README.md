# Pack: core

Harness-neutral workflows, contracts, personas, and epics templates.

## Contents

| Path | Role |
|------|------|
| `skills/` | `/forge-init`, `/forge`, `/forge-plan`, `/forge-light`, `/forge-explore`, `/forge-pilot`, `/forge-review`, `/forge-ui-review`, `/forge-flow-test`, `/forge-sweep`, `/forge-ux-sweep` (+ `skills/forge-ux-sweep/rubric.md`), `/forge-regression`, `/forge-code-sweep` (+ `forge/packs/core/skills/forge-code-sweep/reader.md`, `forge/packs/core/skills/forge-code-sweep/axes.md`), `/forge-chaos-sweep` (+ `forge/packs/core/skills/forge-chaos-sweep/angles.md`, `forge/packs/core/skills/forge-chaos-sweep/worker.md`, `forge/packs/core/skills/forge-chaos-sweep/specialties.md`), `/forge-ui-detail` (+ `forge/packs/core/skills/forge-ui-detail/principles.md`, `forge/packs/core/skills/forge-ui-detail/anatomy.md`), `/forge-debug`, `/forge-smoke` (dogfood) |
| `rules/` | **execution-contract**, **artefacts**, **sweep-ledger**, task-sizing, code-discipline, packs, product-lenses, depends_on, autonomous-scope |
| `personas/` | Roles + product lenses + **`lenses/`** (correctness, dry, architecture, security, qa-ux) |
| `templates/` | task, notes, review, feature, epic, decisions, memory-epics, next-task-prompt, how-agents-use-this, explore-report, delta-spec |

Always enabled. Stack architects in `angular`/`java` packs.  
Ceremony override: `min` \| `normal` \| `strict` (`forge/packs/core/rules/execution-contract.md`).  
Strict Code path: `forge/packs/core/rules/code-discipline.md`. Strict Quality: multi-lens fan-out in `execution-contract.md`. Visual: `forge/packs/visual-qa/` pack.
