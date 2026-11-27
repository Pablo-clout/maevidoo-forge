# Forge — agent charter

Always-on router for every harness. Keep this file short; details live under `forge/`.

1. **Non-negotiables** — `forge/constitution.md`
2. **Project routing** — `forge/project.md` (packs, ceremony default, visual_qa)
   **What the product is** — `docs/vision.md` (the human's document: vision, big features, architecture, UI direction; agents propose changes, the human accepts) · **the app as it is** — `docs/features.md` · both belong to the project and live outside `forge/` (`forge/packs/core/rules/product-docs.md`). After installing or upgrading Forge, run `/forge-init`: it moves and consolidates what the project already has.
3. **Skills SSOT** — `forge/packs/core/skills/<name>/SKILL.md`

## Commands

| Command | Role |
|---------|------|
| `forge-init` | Bootstrap `project.md` + packs |
| `forge` | **Default.** Plan a task, then execute it with the judges it deserves; asks `Go` only on risky work |
| `forge-plan` | Plan only (orient → clarify → artefacts), to approve before any code |
| `forge-light` | Fast path: main plans, builds and closes; one light tester checks |
| `forge-explore` | Deep repo/web synthesis (no product code) |
| `forge-pilot` | Execute an already planned task (Code → judges → Scrum) |
| `forge-review` | Review-only pass |
| `forge-ui-review` | UI/UX review of a running screen (measured) |
| `forge-flow-test` | Walk every user flow of a screen or endpoint (fields, failures, keyboard) |
| `forge-sweep` | Weekly deep check of the whole app: walk every feature, fix on a branch, one report |
| `forge-ui-detail` | The eye for detail: every component close up, side by side, at every width, against principles and anatomy cards |
| `forge-ux-sweep` | Deep UX/UI audit of every screen against the rubric and the app's canon; consistent run to run (UI ledger) |
| `forge-chaos-sweep` | The last net for a stable app: cheap free testers on each workflow, careless on purpose, replaying what they find; checked, then one report; findings only |
| `forge-regression` | The regression pack: the scenarios that must always work, in plain words the human owns, replayed the same way every run; passes or broken |
| `forge-code-sweep` | Deep review of the code as it stands, area by area: security, data, performance, architecture, dead code, tests; measured, checked; findings only |
| `forge-debug` | Reproduce → root-cause → minimal fix |
| `forge-smoke` | Dogfood / E2E harness report |

## Ceremony

Optional override: **`min` | `normal` | `strict`**.  
Canon + budgets: `forge/packs/core/rules/execution-contract.md`. Never `min` when visual refs exist.

## Continuity

Durable state: `epics/memory.md` + `epics/_next-task-prompt.md`. Prefer artefacts on disk over long chat.  
**Product lenses** (PO/UX/BO/…) load by task signal — never as slash commands (`product-lenses.md`).

## Packs

Enable via `forge/project.md` → `packs.enabled`. Load rules with `forge/packs/core/rules/pack-loading.md`. Optional: `safety`, `hooks`, `memory-bridge` (yellow).
