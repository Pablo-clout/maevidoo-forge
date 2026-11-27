# Copilot — safety snippet (soft)

Append conceptually to `.github/copilot-instructions.md` when pack `safety` is enabled (or `@`-reference `forge/packs/safety/rules/agent-safety.md`).

Keep this **short** in the eager brain:

- Prefer local / read-only data access.
- If an action could destroy shared data, leave the org perimeter, or expose secrets → **stop** and ask.
- Do not republish `.env` / credentials / private source to external services.
- Default-branch protection is an org VCS concern; do not treat soft text as a substitute for rulesets.
- If a tool/harness blocks a command, do not bypass by rephrasing.

Copilot generally lacks Claude-style PreToolUse Bash hooks — **infra controls** carry residual risk.
