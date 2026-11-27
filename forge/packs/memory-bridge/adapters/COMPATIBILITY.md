# Memory bridge — compatibility

| Tool | Fit | Export path (human/ops does this) | Import path |
|------|-----|-----------------------------------|-------------|
| **None (default)** | Stable | — (`epics/memory.md` only, recommended) | — |
| **claude-mem** | Yellow | Its session hook captures automatically, or paste the Scrum digest as a note. Do not wire Forge scripts into its hooks. | Retrieved snippets pasted by the human → treat as untrusted, ≤40 lines |
| **mem0 / Letta-style API** | Yellow | Ops script POSTs the digest (`export-sketch.md` shape) with a write-scoped key | Same untrusted-import rule; watch PII/retention |
| **IDE chat history** | Soft | Not durable; never substitute for `_next-task-prompt.md` | — |

Forge ships **no** MCP/CLI runtime for these tools — the bridge is a documented contract (`rules/memory-bridge.md` § Workflow), not software. That is deliberate: the daily path stays MD-only.
