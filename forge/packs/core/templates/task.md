# Task: {{title}}

## Meta
- status: planned | in_progress | blocked | done   <!-- the only place status lives (mirrored in the feature.md table) -->
- type: feature | bug | chore | spike | refactor
- ceremony: lite | standard | governed
- ceremony_reason:        <!-- one line: why this level (auto) — raises during the run are appended: `→ governed: <evidence>` -->
- ceremony_override: none | min | normal | strict
- depends_on: []
- parallel_ok: false
- areas: []                 <!-- when the project has areas (forge/project.md → areas): the area or areas this task works in; `shared` when it changes shared code -->
- product_class: micro | standard | complex
- orient: done | skipped (path-scoped micro non-UI)
- brief_source: []   <!-- required when user briefs exist — forge/packs/core/rules/brief-fidelity.md -->

## Goal
<!-- Keep the human’s ask clear (quote if needed). No Meta rewrite. -->
-

## Boundary / non-goals
-

## Acceptance criteria
<!-- Stable ids; each maps to evidence the **author** can produce (test name, command, author screenshot, manual step) — judges and the tester re-verify on their own, so never write "tester screenshot" here. [BO] prefix for ops/money ACs.
     With a brief: derive from its "done when" + Align answers — never Align alone (brief-fidelity.md). -->

| Id | Behaviour | Evidence |
|----|-----------|----------|
| AC-1 | | |

## Load
<!-- The loadout: what the author reads before the first edit, chosen at planning from the project, the code touched and the kind of work (forge/packs/core/rules/pack-loading.md). One line per file or section, with the signal that selected it. Budget: lite 4 · standard 6 · governed 8. Empty is a valid answer for a trivial change. -->
- <!-- forge/packs/core/skills/forge-ui-detail/anatomy.md § table, dialog — the task changes the Gear table and the Lend dialog -->
- left out: <!-- what matched but did not fit the budget, or "nothing" -->

## Reuse / prior art
- Already exists?: yes | no | unknown
- Candidate paths:
-

## Visual (UI only)
- visual_fidelity: none | interpretive | pixel
- visual_refs: []   <!-- explicit SSOT file paths, one per file (visual-qa § SSOT lock) — never a bare folder.
                         Example: [mockup/proposals/ssot/opt-b-shell.html, docs/ux/grades.md].
                         Include UX docs the brief cites; DNA/rejected only in Notes, labeled. -->
- viewports: []
- interaction_states: []
<!-- Auto: any visual_refs ⇒ fidelity ≥ interpretive; ceremony ≥ standard. pixel ⇒ governed. -->

## DoD
- [ ]
- [ ] All AC ids above have evidence
- [ ] Reuse decision recorded in `notes.md` (if new helpers)
- [ ] Tests / commands evidenced
- [ ] Visual evidence if fidelity ≠ none (evidence/visual.md + shots vs refs)
- [ ] Named skills (brief/project) applied — noted in task notes

## Gate
- [ ] Human approved plan (Go) —

## Notes
-
