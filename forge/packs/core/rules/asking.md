# Rule: asking the human

Two rules, in this order.

**1. Look it up before asking.** Most questions already have their answer, and a developer should not be asked what the project already says. Check, in this order:
- `forge/project.md` (packs, `knowledge`, `commands`, `notes`);
- the repository (code, its documents, its tests);
- the request and its briefs;
- `epics/decisions.md` (what was decided before, and why).

Ask only what none of them settles **and** that changes the result: an acceptance criterion, the scope, a visible behaviour, something costly to undo. Everything else is decided, and written down as an `assumption:`.

**2. A question that remains goes through the host's question tool. Never as text in a reply.** That covers `/forge-init` setup, Align, the **Go** gate, a blocked Code agent and a sizing doubt.

**Why:** nothing guarantees the developer reads a paragraph of chat. A question buried in a reply gets missed or half-answered, and the run goes on with a guess. A question dialog stops the run at the decision, shows the options side by side, and returns an unambiguous answer the agent can record.

## Which tool

| Host | Tool |
|------|------|
| Claude Code | `AskUserQuestion` |
| Antigravity | `ask_question` |
| Cursor / GitHub Copilot | the ask-question tool the session exposes, if any |
| None available (the only case where text is allowed) | the questions **alone, as the last lines of the message**, numbered, with A/B/C + **Other**. Then stop and wait: no work continues past an unanswered question |

Use what the session actually lists — never invent a tool name. State the fallback once (`No question tool in this host — asking in chat`).

## How to ask

- **One decision per question**, 2–4 concrete options. The tool adds "Other" itself — do not add one.
- **Put your recommendation first** and mark it `(Recommended)`; give each option a one-line consequence, not a restatement of its label.
- **Batch**: all questions of one round in a single call (hosts cap a call at about 4 questions — split a longer round into consecutive calls, most blocking first).
- **Ask only what the human must decide** (rule 1). Say in the question what was already looked up, so the human does not answer what the project knows (`project.md and DESIGN.md do not say whether…`).
- **Never a question inside a report or a summary.** A question written in the middle of a reply is not asked. If a host tool exists and a question matters, call the tool.
- The question must stand alone: name the feature/task and the thing being decided — the human may see only the dialog.
- **Go gate** = a question too: `Go` (recommended when the plan passed its checks) / `Revise` — with the task count and ceremony in the question text.

## Who asks

Only **main** talks to the human. A worker (Orient, Code, a lens) that needs an answer writes the question in `notes.md` (Code handoff → blocking questions), returns, and main asks it — then re-spawns the worker with the answer.

## After the answer

Record it where the next agent will read it: decisions in `task.md` Notes or `notes.md` § Decisions, with the date. An answer that only lives in chat is lost at the next session.
