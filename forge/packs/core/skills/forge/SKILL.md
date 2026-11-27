# Skill: /forge

**Purpose:** The default command. One message from the ask to shipped, judged work: it **plans** the task, then **executes** it, without a stop in between unless the task is risky. It adds no method of its own. It chains the two skills that hold the method:

1. `forge/packs/core/skills/forge-plan/SKILL.md` — orient, clarify, size, write the task artefacts;
2. `forge/packs/core/skills/forge-pilot/SKILL.md` — Code, judges, fix rounds, Scrum, report.

| You want | Use |
|----------|-----|
| The whole thing done, with the judges the task deserves | **`/forge`** |
| To read and approve the plan before any code | `/forge-plan`, then `/forge-pilot` |
| Speed and low token use: main builds it, one light tester checks it | `/forge-light` |

## Inputs

- The request, with optional `@` files, briefs and visual references. Everything `/forge-plan` accepts.
- Optional words:
  - `min` | `normal` | `strict`: the ceremony (`forge/packs/core/rules/execution-contract.md` § Ceremony);
  - `plan-only`: stop after the plan, exactly like `/forge-plan`;
  - `confirm`: always ask `Go` before executing.
- Read now: `forge/constitution.md`, `forge/project.md`. The two skills name what else to read, when they reach it. Missing `forge/project.md` → `/forge-init`, stop.

## Procedure

### 1. Plan
Follow `forge/packs/core/skills/forge-plan/SKILL.md`, steps 0 to 4, unchanged: classify, orient, align, product lenses, size, write the artefacts. Two points matter more here, because nobody reads the plan before it runs:

- **Ask what changes the result, and only that.** A question goes to the human (host's question tool, `forge/packs/core/rules/asking.md`) when its answer would change an acceptance criterion, the scope, or a visible behaviour. Everything else is decided, and written in `notes.md` as `assumption: …`. One round of questions; a second only if an answer opened a new fork.
- **Acceptance criteria are the contract.** They are what the judges will check and what the report will be measured against. Write them so that a tester can say yes or no.

### 2. Gate — when `/forge` goes on by itself
Invoking `/forge` **is** the human's `Go` for ordinary work. Main records it in `task.md` (`gate: Go — /forge, <ISO date>`), prints the plan in at most 8 lines (goal, tasks, ceremony, assumptions, what is skipped), and goes straight to step 3. The human can interrupt.

It **stops and asks `Go`** (`Go` / `Revise`, as in `/forge-plan` § 5) when any of these is true:

- the ceremony is `governed`: authentication or permissions, money, personal data, a migration or another irreversible data operation, a public API contract, `visual_fidelity: pixel`;
- the plan has **more than 3 tasks**, or the work turned out to be two features;
- an Align question is still open, or the human's answers contradict the brief;
- the plan drops something from a brief (`omitted: …` in `notes.md`);
- the human wrote `confirm`, or `forge/project.md` says `profiles.gate: always`.

`plan-only` → stop here, as `/forge-plan` does.

### 3. Execute
Follow `forge/packs/core/skills/forge-pilot/SKILL.md` on the task, or on the feature folder in dependency order (`forge/packs/core/rules/depends-on.md`). The ceremony announced at planning is the starting level; the pilot raises it on evidence, never lowers it. Everything the pilot says about who does what applies: main never codes and never judges.

### 4. Close and report
The pilot closes with the Scrum checklist: the journal entry in `epics/decisions.md`, the line in `epics/to-sweep.md`, the task folder deleted. Nothing else stays on disk.  
Then the pilot's report (§ F), preceded by one line: what was assumed without asking. Assumptions the human should confirm are listed as follow-ups (human).

## Anti-goals

- No method of its own: when this file and one of the two skills disagree, the skill wins, except for § 2 Gate
- No silent guess on something that changes an acceptance criterion: ask, or stop
- No going on by itself on `governed` work
- No skipping the judges to finish faster: that is `/forge-light`, chosen by the human, not a shortcut taken here
