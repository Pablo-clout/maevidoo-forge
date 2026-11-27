# Rule: agent safety (short — for models)

Load when pack `safety` is enabled. **Keep this file short.** Detailed catalogues stay in `denied-actions.md` / `deny-patterns.yml` for humans and hooks — do not paste them into context.

## Default posture

- Prefer **local** tools and **read-only** data access.
- If an action could destroy shared data, leave the org perimeter, or expose secrets → **stop** and ask the human (record in task notes).
- Destructive data-store changes need an explicit **Go** (or written exception) on the task.
- Never publish credentials, `.env` contents, or private source to external paste/chat/upload services.

## Machine deny

If Claude Code hooks / deny adapters are installed (`packs/safety/install.md`), treat a harness **block** as final — do not rephrase the same command to bypass.

## Out of scope here

Default-branch push protection = **org VCS rulesets**, not this pack’s job.

## Load-trace

```text
🧩 Safety: pack on — short policy; machine deny via harness if installed
```
