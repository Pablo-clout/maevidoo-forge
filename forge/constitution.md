# Forge constitution

Keep this file short. It is the always-on contract for every Forge session.  
Harness entry router: root **`AGENTS.md`**.

## Non-negotiables

1. **Artefacts over chat** — durable state lives in Markdown under the task/feature path (`task.md`, `notes.md`, `review.md`); closed work is distilled into the dated `epics/decisions.md` (what, why, decisions) and queued in `epics/to-sweep.md` for the next sweep; **every command deletes its working files at close**.
2. **Proportionate ceremony, chosen by the orchestrator** — `lite` | `standard` | `governed`, picked per task from its risk and the worker model's strength, raised when the run shows a problem (human override: `min` | `normal` | `strict`, or “more” / “less”); never force epic ceremony on a one-line **non-UI** fix; never use `lite` when visual refs exist (`forge/packs/core/rules/execution-contract.md`).

3. **Bounded exploration** — orient/ground in a subagent; do not dump the whole repo into the main context.
4. **Author ≠ judge** — self-check is layer 1; fresh review and **signal-matched quality lenses** are separate contexts.
5. **Reuse before rewrite** — search and extend existing code; duplicate domain logic is a process failure (`forge/packs/core/rules/code-discipline.md`).
6. **Local commits only by default** — no push/deploy unless the human explicitly asks.
7. **Packs via `project.md`** — stack rules load from enabled packs; core stays harness-neutral.
8. **Evidence to check boxes** — tests, commands, or visual proofs; no declarative “done”.
9. **Visual fidelity when referenced** — mockup/HTML/screenshot in scope ⇒ implement and verify against it (`forge/packs/visual-qa/rules/visual-qa.md`).
10. **MCP off by default** — optional tools are adapters, never the core.
11. **Handoff continuity** — `epics/memory.md` + `epics/_next-task-prompt.md` (see `forge/packs/core/rules/artefacts.md`).
12. **Bounded quality loops** — max 3 review and 3 quality rounds (`forge/packs/core/rules/execution-contract.md`); then human.
13. **Questions through the host's question tool** — Align, gates and blockers use the structured ask dialog when the host has one; chat text is the fallback (`forge/packs/core/rules/asking.md`).
14. **Safety posture** — shared DB destruction, exfiltration, and secret publish are out of bounds by default; enable pack `safety` for short policy + optional harness deny. Default-branch push = **org VCS rulesets**. Never dump long deny catalogues into the model context (`forge/packs/safety/`).
15. **The command's file is the procedure** — read the skill at the start of each task, and again after the conversation was summarised; never run a command from memory of it. Never record work as done with a command whose file was not followed.
16. **A session instruction adds to a command; it does not replace it** — "a fresh reviewer after every change", "run the suites once" are extra requirements. The level, the Go gate, the judges and the stop rules of the command still apply; when the two truly conflict, say so and ask.

## Command map

See adapters: `forge-init`, `forge` (default: plan + execute), `forge-plan`, `forge-light`, `forge-explore`, `forge-pilot`, `forge-review`, `forge-ui-review`, `forge-flow-test`, `forge-sweep`, `forge-ux-sweep`, `forge-ui-detail`, `forge-chaos-sweep`, `forge-regression`, `forge-code-sweep`, `forge-debug`, `forge-smoke` (dogfood / E2E).
