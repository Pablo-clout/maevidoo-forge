# Rule: shell commands

Agent terminal hygiene (Code, debug, explore).

- **No foreground watch/serve** — a dev server never blocks the agent shell. When you need the app running (visual loop, tester), start it **in the background**, use it, and **stop it** before you return — stop the process that listens on the port (find it by port, e.g. `lsof -ti :<port>` or `fuser <port>/tcp`), not by command name, then check the port is free. On hosts with a dedicated daemon flag (e.g. Antigravity `run_command` with `IsDaemon: true`), use it instead of a bare `&` so the server survives across tool calls, and terminate it via the host's task manager (`manage_task`) when done.
- **Never wait in a loop.** No `sleep` or poll loop that watches for a background job until the command times out: on a measured run the ten longest commands were all such loops, cut at the ten-minute limit, and they hid the result they were waiting for. A command that will run more than about two minutes (a full test suite, a build, a browser suite) is **started in the background** with the host's own mechanism; the host tells you when it ends. If the host cannot, check once after the time the command usually takes — never a loop.
- **Use the wait.** While a long command runs, do work that reads: re-read your own diff as the judge will, check each acceptance criterion against it, write your notes, prepare the next command. Do not edit what the command is testing: its result would mean nothing.
- **`git --no-pager`** — avoid pager hangs on `log` / `diff` / `show`.
- **No `| cat`** — use flags (`--no-pager`, `--color=never`) instead of piping to defeat pagers.
- **Batch slow builds** — one install/build/test wave when possible; no tight restart loops.
- Prefer exit codes + last lines over dumping full build logs into chat.
