# Skill: /forge-flow-test

**Purpose:** Use the running app the way its users will — every flow of the changed screen or endpoint, end to end, field by field — and report what does not behave. Findings only; no implementation.

Use it on its own (`/forge-flow-test <url or task path>`). `/forge-pilot` runs it automatically, through the `flow` lens, on every task that creates or changes a screen, next to the UI review. The UI review judges how the screen **looks**; this judges what it **does**.

**Why a dedicated skill:** authors test the path they built, with the data they had in mind. What ships broken is next to that path: the button beside the new one, the second time you press Save, the item someone else deleted, the user who never touches the mouse. Reading the code does not find these; walking the flows does.

## Inputs

- A URL, or a task path (then `forge/project.md` → `commands.dev` / `commands.url` / `commands.test`, and the task's acceptance criteria)
- Read: `forge/project.md`; the task's `task.md` when there is one. Do **not** start from the author's notes — form your own list first.

## Procedure

### 1. List the flows — before touching anything
Open the screen and write the list:

- **New flows** the task adds (from the acceptance criteria).
- **Neighbours:** every existing action on the same screen or resource — create, edit, delete, filter, navigate away and back. A change is not done if the action beside it is broken. One that was already broken before the task is still a finding, at its normal severity, marked `pre-existing`: main sends it to Code when the fix is small and on the screen the task touches, to the human otherwise.
- For each flow: the steps, and what the user should see and what the data should be afterwards.

### 2. Walk each flow for real
Start the app (or use the one the parent started) and drive it with real events — clicks, typing, key presses — through a headless browser; for an API-only change, call the endpoints in sequence. For each flow, the happy path first, then:

| Variation | What it finds |
|-----------|---------------|
| **Do it twice** — double click, double submit, same action again | duplicates, a second request racing the first |
| **Abandon it** — Cancel, Escape, navigate away, reload mid-flow | half-saved data, a form that reopens dirty |
| **Stale data** — change or delete the item elsewhere (second tab, direct API call), then finish the flow | silent overwrite, an edit that vanishes, an error nobody sees |
| **The server fails** — unreachable, 404, 500 | nothing shown, an uncaught exception, a form stuck open |
| **Another flow open at the same time** — two editors, a create while editing | one discarding the other's input |
| **Keyboard only** — Tab, Enter, Space, Escape, no mouse | unreachable controls, focus lost after an action |

After **every** action note four things: what the user sees (confirmation, error, nothing), the data (API or storage), where the focus is, and whether the page threw (console errors, unhandled rejections).

### 3. Field matrix
For every input of the changed flows, try: empty · only spaces · the shortest and longest allowed value · one past each limit · the wrong type or format · a value that does not exist (a date like 30 February) · markup (`<img src=x onerror=alert(1)>`) · a very long unbroken string. For each: is it refused or accepted as the rules say, is the message next to the field and tied to it, and was anything saved that should not be?

### 4. Tools
`node forge/packs/visual-qa/tools/run-ui-probe.mjs --url <url> --before "<steps>" --json <file>` runs a scripted flow in a fresh browser and reports what the page did: a value you `return` from `--before` (counts, texts), **page errors** (exceptions, unhandled rejections), **where the focus ended up**, and the UI measurements. `--seed` prepares storage, `--reload` checks persistence, `--block "<url part>"` makes matching requests fail (server unreachable). One flow or variation per run. A longer scenario — two tabs, many steps — is a throwaway script outside the repo, driving the same headless browser.
Also run the project's tests (`commands.test`) once: a red suite is a finding.

### 5. Report
Reply with a verdict (`pass | fail` — fail on any Critical or High) and:

1. **Flow table** — one row per flow and variation actually walked: `flow · variation · result (ok | defect | not walked: why)`.
2. **Findings**, at most 10: `Severity · Flow and step · What happened · What should happen · Evidence (run, returned value, screenshot)`.
3. **Field matrix** — only the cells that failed.
4. What you could not walk, and why.

Severity (`forge/packs/core/rules/execution-contract.md` § Severity): data lost or wrong, or a flow that cannot be completed, is High — one level lower when it needs an unusual situation; a failure the user is not told about is Medium; focus lost or a missing confirmation is Medium when it blocks keyboard users, Low otherwise.

Standalone run on a task: you are a judge — append the report to the task's `review.md` as `## Flow test — <date>`. No task: reply only. Leave nothing in the repo.

## Sharing the app, and later rounds

- **Shared app** (the parent says another tester uses it too): create your own records, with a recognisable name; never edit or delete what you did not create, never restart the server or wipe the data. A flow that needs an empty or restarted app: start your own instance on another port if the project's start command takes one, else mark it `not walked`.
- **Round 2 and later:** walk again only the flows that had a defect and those the fix touched (the parent gives the fix diff), then one happy path of each other flow. Open with the status of each earlier finding: `fixed | open`.

## Anti-goals

- No code edits; no verdict from reading the code or the author's notes
- No "works" for a flow you did not walk — write `not walked` and why
- No stopping at the new flow: the neighbours are part of the job
- No new dependency in the project
