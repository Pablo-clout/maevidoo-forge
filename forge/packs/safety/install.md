# Install Forge safety (hard deny) — Claude Code

## Prerequisites

- Claude Code with PreToolUse hooks support
- `python3` on PATH
- Pack `safety` enabled in `forge/project.md`

## Steps

1. Set absolute repo root (example):

```bash
export FORGE_ROOT="/path/to/your/repo"
```

2. Merge `adapters/claude/settings.fragment.json` into **project** `.claude/settings.json`  
   (or user `~/.claude/settings.json` for all projects).

3. Replace `$FORGE_ROOT` in the hook `command` with your real path, e.g.:

```json
"command": "python3 /path/to/repo/forge/packs/safety/adapters/claude/hooks/pretooluse-bash.py"
```

4. Restart Claude Code / start a new session.

5. Smoke-test (should block):

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"psql -c \"DROP TABLE t\""}}' \
  | python3 forge/packs/safety/adapters/claude/hooks/pretooluse-bash.py ; echo exit:$?
```

Expect deny JSON + exit `2`.

6. Smoke-test allow:

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"git status"}}' \
  | python3 forge/packs/safety/adapters/claude/hooks/pretooluse-bash.py ; echo exit:$?
```

Expect exit `0` and empty/non-deny stdout.

## Honesty matrix

See **`adapters/COMPATIBILITY.md`** (Cursor / Claude Code / Copilot / IntelliJ / cloud).

| Host | Hard Bash deny | Soft MD |
|------|----------------|---------|
| Claude Code + this install | Yes | Yes |
| Cursor | Only if you wire host hooks | Yes |
| Copilot / IntelliJ plugins | No portable Forge hook | Yes |
| Cloud agents | No unless installed in that environment | Partial |

## Infra floor (required for enterprise)

- Agent DB roles **read-only** outside disposable local DBs
- No production secrets in the agent environment
- Org secret scanning + default-branch rulesets (out of Forge)

## Uninstall

Remove the PreToolUse entry and optional `permissions.deny` Read(.env*) from settings; disable pack `safety` in `project.md` if desired.
