# Safety — multi-harness honesty

The **policy** (short MD + human SSOT) is portable. The **hard Bash deny** is not equally available on every host.

| Host | Soft policy (`agent-safety.md`) | Hard Bash deny (hook) | What enterprise must still do |
|------|----------------------------------|------------------------|-------------------------------|
| **Claude Code** | Yes | **Yes** if `install.md` applied | RO DB creds, secret scanning |
| **Antigravity** (App / CLI / IDE) | Yes | **Yes** if `adapters/antigravity/install.md` applied (`.agents/hooks.json` `PreToolUse` on `run_command`); **caveat:** `--dangerously-skip-permissions` on CLI is reported to bypass `PreToolUse` hooks — verify with `/hooks` | RO DB creds, secret scanning |
| **Cursor** | Yes | **Only if** that Cursor build exposes PreToolUse-like hooks / sandbox you wire yourself — see `adapters/cursor/README.md`. Default = soft | Same infra floor |
| **GitHub Copilot** (IDE / Coding Agent) | Yes (snippet) | **No** reliable portable Bash PreToolUse | Infra + org tool limits |
| **IntelliJ / JetBrains** (+ Copilot or Claude plugin) | Yes if instructions/rules load | **Usually no** equivalent to Claude Code hooks | Infra + IDE permission prompts |
| **Cloud agents** (Copilot cloud, etc.) | Partial | **No** Forge hook in their VM unless you install it there | Strict least-privilege cloud identity |

**Implication:** enabling pack `safety` without installing the Claude or Antigravity hook (or host equivalent) does **not** make DROP/exfil impossible — it only improves soft guidance. Default-branch push remains an **org VCS ruleset** concern on all hosts.
