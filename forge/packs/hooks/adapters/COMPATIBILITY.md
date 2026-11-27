# Hooks pack — Cursor vs Claude

| Host | Mechanical shell deny | Parallel subagent cap | Notes |
|------|------------------------|------------------------|-------|
| **Cursor** + this pack | **Yes** if `install.md` applied (`beforeShellExecution` → safety catalogue, incl. `allow_if_matches`) | **Prose only** (`execution-contract.md` § Pilot budget — no host API for reliable counts) | |
| **Claude Code** | **`packs/safety` PreToolUse** — not this fragment | Prose / pilot budget only | Keep Claude on safety pack; do not dual-wire Cursor JSON into Claude settings |
| **Antigravity** | **`packs/safety` PreToolUse** (`forge/packs/safety/adapters/antigravity/install.md`) — not this fragment | Prose / pilot budget only | Uses `.agents/hooks.json` on `run_command` |
| **GitHub Copilot** | Soft policy only | Soft | No portable Forge hooks |

**Implication:** enabling pack `hooks` without Cursor hook support (or without `safety` catalogue) does not harden Claude, Antigravity, or Copilot. Claude and Antigravity hard deny live in `forge/packs/safety/`. This pack ships **no** subagent-cap hook — we do not claim enforcement we cannot deliver.
