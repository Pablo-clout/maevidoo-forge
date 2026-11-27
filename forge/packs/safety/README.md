# Pack: safety

Optional **machine + policy** guardrails for destructive data-store ops, exfiltration, and secret leakage.

Activate via `forge/project.md` → `packs.enabled` include `safety`.

## What this pack is

| Layer | Where | Role |
|-------|--------|------|
| **MD (short)** | `rules/agent-safety.md` | Soft contract for agents — **minimal priming** |
| **MD (human)** | `rules/denied-actions.md` | Auditable policy for SecOps / PR review |
| **Catalog** | `catalog/deny-patterns.yml` | Patterns for the hook (not loaded into LLM hop-1) |
| **Hard (opt-in)** | `adapters/claude/*`, `adapters/antigravity/*` | Claude Code `permissions` + PreToolUse hook · Antigravity `.agents/hooks.json` PreToolUse hook |
| **Soft snippets** | `adapters/cursor`, `adapters/copilot` | Degraded hosts |
| **Honesty** | `adapters/COMPATIBILITY.md` | Cursor / Copilot / Antigravity / IntelliJ / cloud matrix |

## What this pack is not

- Not equal hard deny on Cursor, Copilot, IntelliJ, or cloud by default
- Not a substitute for **read-only DB credentials** or org secret scanning
- Not focused on blocking push-to-default-branch (use GitHub/GitLab rulesets)
- Not a guarantee if only the MD is enabled and the hook is not installed

## Install hard deny (Claude Code / Antigravity)

- **One matcher for every host:** `catalog/matcher.py` is the only code that reads `catalog/deny-patterns.yml`. Each host hook (Claude Code, Antigravity, and Cursor through pack `hooks`) only translates its own payload, calls the matcher, and translates the answer back. A hook that cannot read what it receives, or cannot load the matcher, asks the human instead of allowing.
- **Claude Code:** see `install.md`. Copy fragment into `.claude/settings.json` and point the hook at `adapters/claude/hooks/pretooluse-bash.py`.
- **Antigravity:** see `adapters/antigravity/install.md`. Merge `adapters/antigravity/hooks.fragment.json` into `.agents/hooks.json`.

## Agent load

When pack enabled: Code / Pilot hop-2 may load **only** `rules/agent-safety.md` (short).  
Do **not** dump `denied-actions.md` or the YAML catalog into the model context.
