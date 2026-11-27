# IntelliJ / JetBrains — safety notes

JetBrains IDEs (IntelliJ, WebStorm, …) with **GitHub Copilot** or **Claude** plugins do **not** currently get Forge’s Claude Code PreToolUse hook automatically.

## Soft

- Ensure project-level AI instructions / `.github/copilot-instructions.md` / Claude project rules can see `forge/packs/safety/rules/agent-safety.md` when pack `safety` is enabled.
- Keep the short policy only — do not paste `denied-actions.md` into always-on rules.

## Hard

- Prefer running destructive-capable agent sessions in **Claude Code** (or another host where `install.md` hooks are active) for DB-touching work.
- Rely on **read-only DB credentials** and IDE confirmation dialogs for shell.
- Org VCS rulesets still protect default branches.

## Cloud Coding Agent

Same as Copilot cloud: soft policy may load; Forge Bash hook does not run unless you install an equivalent gate in that runner image (out of default Forge scope).
