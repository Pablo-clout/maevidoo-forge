# Install Forge safety (hard deny) — Antigravity

Wraps `catalog/deny-patterns.yml` (via `adapters/claude/hooks/pretooluse-bash.py`) into Antigravity's native `PreToolUse` hook on `run_command`. Works across Antigravity App, Antigravity CLI, and Antigravity IDE.

## Prerequisites

- Google Antigravity with lifecycle hooks enabled
- `python3` on PATH
- Pack `safety` enabled in `forge/project.md`

## Steps

1. Merge `hooks.fragment.json` into **workspace** `.agents/hooks.json` (or global `~/.gemini/config/hooks.json` with an absolute path to `hooks/pretooluse-command.py`).

2. If using the global config, replace the relative script path with your repo's absolute path:

```json
"command": "python3 /path/to/repo/forge/packs/safety/adapters/antigravity/hooks/pretooluse-command.py"
```

3. Verify active hooks in Antigravity (`Settings > Customizations > Hooks` in the App, or `/hooks` in the CLI).

4. Smoke-test (should deny):

```bash
echo '{"toolCall":{"name":"run_command","args":{"CommandLine":"psql -c \"DROP TABLE t\""}}}' \
  | python3 forge/packs/safety/adapters/antigravity/hooks/pretooluse-command.py
```

Expect `{"decision": "deny", "reason": "Forge safety: blocked (db-drop)..."}` (exit `0`).

5. Smoke-test allow:

```bash
echo '{"toolCall":{"name":"run_command","args":{"CommandLine":"git status"}}}' \
  | python3 forge/packs/safety/adapters/antigravity/hooks/pretooluse-command.py
```

Expect `{"decision": "allow"}` (exit `0`).

6. Fail-safe check (unreadable or renamed payload must force confirmation, never silently allow):

```bash
echo '{"toolCall":{"name":"run_command","args":{"command_line":"rm -rf /"}}}' \
  | python3 forge/packs/safety/adapters/antigravity/hooks/pretooluse-command.py
```

Expect `{"decision": "force_ask", "reason": "Forge safety: could not read CommandLine..."}` (exit `0`).

## Important caveat: `--dangerously-skip-permissions`

Third-party live testing on Antigravity CLI (`agy` 1.1.21) reports that launching with `--dangerously-skip-permissions` bypasses `PreToolUse` hooks entirely (the hook is not invoked at all). We have not verified this directly against a newer `agy` build in a remote VM, so **do not assume this hook fires under `--dangerously-skip-permissions`**.

If you want fewer prompts while keeping the hook active, configure `toolPermission` (`auto` or `always-proceed`) + explicit deny rules in `/permissions` instead of `--dangerously-skip-permissions`, and verify with `/hooks` and a test call before trusting it.

## Uninstall

Remove the `forge-safety-command` entry from `.agents/hooks.json` (or `~/.gemini/config/hooks.json`); disable pack `safety` in `forge/project.md` if desired.
