# Install Forge hooks (Cursor) — opt-in

## Prerequisites

- Cursor with project hooks (`.cursor/hooks.json`)
- `python3` on PATH
- Pack `hooks` enabled in `forge/project.md`
- Prefer pack `safety` enabled (deny patterns live there)

## Steps

1. Merge `adapters/cursor/hooks.fragment.json` into project **`.cursor/hooks.json`** (create the file if missing; keep `version: 1`).
2. Paths in the fragment are repo-relative and call pack scripts via `python3` — no copy required.
3. Ensure scripts are executable (optional on Unix if invoked via `python3`):

```bash
chmod +x forge/packs/hooks/adapters/cursor/hooks/*.py
```

4. Reload Cursor / open Hooks settings and confirm the `beforeShellExecution` event appears.
5. Smoke shell deny (should block):

```bash
echo '{"command":"psql -c \"DROP TABLE t\""}' \
  | python3 forge/packs/hooks/adapters/cursor/hooks/before-shell.py ; echo exit:$?
```

Expect `"permission": "deny"` (or exit `2`) and a safety reason.

6. Smoke the read-only override (should allow):

```bash
echo '{"command":"psql -c \"SELECT 1\""}' \
  | python3 forge/packs/hooks/adapters/cursor/hooks/before-shell.py ; echo exit:$?
```

Expect `"permission": "allow"` and exit `0`.

## Claude Code

Do **not** install this fragment on Claude. Use `forge/packs/safety/install.md` (PreToolUse) instead — see `adapters/COMPATIBILITY.md`.

## Uninstall

Remove the `beforeShellExecution` entry that points at the Forge pack script; disable pack `hooks` in `project.md` if desired.
