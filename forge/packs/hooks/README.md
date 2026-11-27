# Pack: hooks (opt-in)

Mechanical judge for the Cursor shell. **Prose remains the law** (`constitution`, `execution-contract`, `safety` policy). The hook only enforces what prose already forbids.

## When to enable

- You want Cursor `hooks.json` to hard-deny risky shell (DB wipe, exfil, secrets, force-push)
- Pack `safety` already covers Claude PreToolUse — this pack wraps the **same deny catalogue** for Cursor shell (no duplicated patterns)

## Contents

| Path | Role |
|------|------|
| `install.md` | Merge fragment into `.cursor/hooks.json` |
| `adapters/cursor/hooks.fragment.json` | `beforeShellExecution` entry |
| `adapters/cursor/hooks/before-shell.py` | Cursor shell → reuses safety PreToolUse (deny + `allow_if_matches`) |
| `adapters/COMPATIBILITY.md` | Cursor vs Claude honesty |

**Not included:** a parallel-subagent cap hook — no host exposes reliable counts, so that budget stays prose (`execution-contract.md`). We do not ship always-allow theater.

## Enable

Add `hooks` under `packs.enabled` in `forge/project.md`, then follow `install.md`. Prefer enabling `safety` too so the deny catalogue exists.
