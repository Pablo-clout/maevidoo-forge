# Skill: /forge-regression

**Purpose:** The regression pack — the short list of scenarios that must **always** work, replayed the same way every time, with one answer each: *passes* or *broken*. It is what a team does by hand before a release; here the list is kept in plain words in `docs/regression.md`, and a script plays each scenario.

The sweeps explore: their testers are free, and two runs never do exactly the same thing. This does the opposite on purpose. Same scenarios, same steps, same data, every run — so a scenario that passed last week and fails today means the app changed, and nothing else.

**Forge proposes the pack; the human owns it.** Forge decides by itself which scenarios belong, writes them, records their scripts and keeps both up to date. The human reads the file, changes a word, adds a scenario, removes one — and that edit always wins. The file is written to be edited: no command, no selector, no code in it.

## Inputs

- Nothing (update the pack if needed, then run all of it), or scenario ids (`R-3`), or **area names** (`forge/packs/core/rules/areas.md` § 3b: in a project with areas, nothing said and a human present → main asks which area; a scheduled run plays everything). Optional words:
  - `run-only`: play what is recorded, change nothing in the pack;
  - `update-only`: refresh the pack and its scripts, do not report a run;
  - `propose`: also look for scenarios worth adding (done by itself on the first run, and when the map or the vision changed since the last run).
- Read: `forge/project.md` (`commands.*`, `sweep_data`, `areas`), `docs/regression.md` when present, `docs/features.md`, `docs/vision.md`, `docs/sweep-ledger.md`, `epics/decisions.md`, `epics/to-sweep.md`, `forge/packs/core/rules/shell-commands.md`.
- **The pack's language** is the one the human writes in, as in `/forge-sweep`. Only the field names stay fixed, in English or French (`why`/`pourquoi`, `status`/`statut`, `area`/`zone`, `start`/`départ`, `in the end`/`à la fin`, `how`/`comment`, and `by hand`/`à la main`): the tool reads them.

**It never waits for a human**, the area question of an interactive run aside. What it cannot decide goes under *Needs you* in the report.

## Who does what

Main keeps the pack, runs the tool and writes the report. A **recorder** is a fresh agent that turns one scenario (or a few of the same screen) into a script. A **replayer** is a fresh agent that plays a failed scenario by hand, from its text only. No nested spawns, ≤ 3 at once, on the parent's model unless `forge/project.md` says otherwise.

## Procedure

### 0. Before anything
**Disposable data only.** The scenarios create, change and delete records: `commands.url` must be a local address (`localhost`, `127.0.0.1`, `*.localhost`, `*.test`), or `forge/project.md` must say `sweep_data: disposable`. Otherwise stop and say why. Main starts the app once. The tree need not be clean for `run-only`; anything else writes files and wants a clean tree.

**Putting the data back is the contract.** A scenario that passes today must pass tomorrow, so every run starts from the same data: `regression.mjs run` calls `commands.reset` by itself before it plays anything.
- **The project has a reset** → scenarios may use the seeded records (a known customer, a known invoice): they are the same at every run.
- **It has none** → say so first in the report, under *Needs you*: nothing guarantees a run can be repeated. Until there is one, each scenario **creates what it needs** under a name of its own (the pack's header says how names are made, e.g. `Regtest` and the time), and a scenario that can only be played once (it uses up a stock, a quota, a lockout) says so on its `start:` line.
- A scenario never depends on another one having run before it. `--reset-each` puts the data back before every scenario, for the ones that disturb each other.

### 1. The pack — `docs/regression.md` (template `forge/packs/core/templates/regression.md`)

**Missing → write it.** Forge chooses. A scenario belongs when losing it would stop the product from being used, or would cost money, data or trust:
- the main flow of every feature marked `core: yes` in `docs/features.md` — one scenario per feature, end to end, not one per screen. No `docs/features.md` → from the specification and the navigation: one per menu entry where something is written;
- what `docs/vision.md` promises in its first lines;
- sign-in and sign-out, and **one refusal**: what someone without the right must not be able to do;
- every path where money, a personal record or a permission changes;
- one journey that crosses areas or features (what is created here is right over there);
- a Critical or High defect once fixed (`docs/sweep-ledger.md`), when it sat on one of the above: a bug that came once comes twice.

What does **not** belong: a variation of a field, an error message, a layout, a rare option. The sweeps cover those. **10 to 25 scenarios** for a whole app; a pack nobody can read in ten minutes is not read, and then not owned.

Each scenario is a short section a person can follow with the app open: where it starts, the numbered steps as *what the user does → what they must see*, and what must be true at the end — in the data, not only on the screen. Words of the product, not of the code: *"Choose Lend"*, never *"click `#btn-lend`"*. The one technical thing allowed is a page address, written as a person would type it (*"open the address /staff/users.html directly"*) — a refusal often has no other way in. Every scenario Forge writes is `status: proposed <date> — by forge`. It runs like the others; the mark only tells the human it was not yet read.

**Present → keep it up to date, and never against the human.**
- A scenario the human edited, added or confirmed is **never reworded by Forge**. The app no longer matches its words (a renamed button, a step that moved) → *Needs you*, with the wording Forge would use: `R-4, step 3: the button is now "Check out" — is the scenario out of date, or is the app wrong?`
- A `proposed` scenario nobody touched may be reworded by Forge when the app changed on purpose (a task in `epics/decisions.md` says so).
- A scenario removed by the human goes under **Left out** at the bottom of the file, with one line of reason. Forge does not propose it again. The human may remove the line to hear about it again.
- With `propose`, on the first run, or when `docs/features.md` or `docs/vision.md` changed since the last run: add what is now missing (a new `core` feature, a newly fixed Critical defect), as `proposed`. Past 25, propose a replacement, not an addition.
- Numbers are never reused: a removed `R-7` stays removed.

### 2. The scripts — one recording per scenario

`node forge/packs/core/tools/regression.mjs status` says where each scenario stands: `recorded`, `not recorded`, `changed since recorded` (one word of its steps changed — its script no longer proves the text), `by hand`.

For every scenario that is `not recorded` or `changed since recorded`, a recorder writes the script, under `tests/regression/` (one file per scenario, named after its id):
- **The project has an end-to-end runner** (Playwright, Cypress, an HTTP test suite, …) → the script is a test in that runner, written like the project's own, kept apart from them.
- **It has none** → a browser scenario is a small module played by the Forge scenario player, which needs nothing installed: `node forge/packs/visual-qa/tools/run-scenario.mjs --url {url} --script tests/regression/R-<n>.mjs`. The script acts through `user` — `open`, `click("Lend")`, `fill("Member", "Ada")`, `choose`, `see`, `dontSee`, `text`, `read` (a number just created, to find it on the next screen), `request` (a call made with the page's session, to check the data) and `expect` — and the player follows the app from page to page in one browser, so a sign-in holds. Its header lists every call. **Look before you write**: `run-scenario.mjs --url <address> --describe <page>` prints what a page offers (headings, what can be clicked, fields, lines), after an optional sign-in script. Steps that several scenarios share (a sign-in) go in one helper module next to the scripts.
  - **A status, a title, one line of a list**: use `see(text, { exact: true })` or `{ within: "<that line>" }`. A bare `see("Confirmed")` is also true of *"Reservation confirmed."* and of a filter called *Confirmed*, and then proves nothing.
  - `user.page(...)` — raw JavaScript in the page — is the last resort, with a comment saying what the player could not do. Never a class or an id in it: a tag (`h1`, `tbody tr`) at most. An API scenario with no screen is a shell file of requests that exits non-zero on the first wrong answer.
- **The script follows the text, step for step**, each step announced with the scenario's own words (`user.step("2. …")`, or a comment in the project's runner), so that a failure names the step a person can read. It checks **every** "→ must see" and the *in the end* line. It finds things the way a user does — by their visible name, never by a class or an id — so that a restyled screen does not break it and a renamed button does.
- **It creates what it needs** under a name of its own, and does not depend on another scenario having run before.
- **It must be seen to fail.** The recorder runs it (passes), then breaks **what the scenario is about** — the expected result of its most important step, as shown on screen — and runs it again (fails), does the same for the *in the end* check, then puts both back. A script that cannot fail proves nothing; a script that can only fail on its last line proves little. The recorder reports the runs.
- Then `node forge/packs/core/tools/regression.mjs record --id R-<n> --run "<the command>" --verify`. Write `{url}` in the command where the app's address goes, and no path of this machine: the recording must run on another machine and in CI.

A scenario no script can play (a real email to open, a payment terminal, a printed page) gets `- how: by hand` and one line saying what stops it. The report lists these every time: they are the part a person still does.

A scenario that **fails while being recorded** is not recorded as passing and not rewritten until it passes. It is the first finding of the run.

### 3. Run
`node forge/packs/core/tools/regression.mjs run --json <scratch>/regression.json` (`--only`, `--area` to limit). It puts the data back (`commands.reset`), plays each scenario and prints one line each; it stops at once, and says so, when the app does not answer — that is not a failed scenario. Launch it in the background and read on; never wait for it in a loop.

### 4. A scenario fails — whose fault?
A red script means one of three things, and only one of them is a regression. For each failure, a replayer gets **the scenario's text only** — not the script, not the output — and plays it by hand in the running app, after `commands.reset`.
- **It fails by hand too**, at the same step → **the app is broken**: a finding, `High` at least, `Critical` when data or money is lost or a refusal no longer refuses. The steps are the scenario itself.
- **It passes by hand, every step exactly as written** → **the script is out of date** (a field moved, a slower screen). A recorder repairs the script, sees it pass and sees it fail, and records it again. The report says `R-<n>: script repaired — <what had changed>`. A script repaired twice in a row for the same reason is fragile: say so.
- **It passes by hand only by doing something else than the text says** → **the scenario is out of date**: *Needs you* (§ 1). Not recorded again until the human has answered. Never bend a script to make a scenario pass.
- **Fails once, passes the second time** → `unstable`, named with what was seen. Three unstable runs in a row is a finding.

**This command fixes no product code.** A broken vital scenario is worth a human's look; the report gives the line to paste into `/forge-debug`.

### 5. Report and close
1. Write `epics/sweeps/regression-<date>.md` — short, for the person who owns the product:
   - **Verdict**, one line: `18 of 20 pass · 1 broken · 1 by hand`;
   - **Broken** — per scenario: its title, the step where it stops, what was seen there, and `/forge-debug <one line>`;
   - **Needs you** — scenarios out of date, with the wording proposed; scenarios `proposed` and not yet read, by title;
   - **Scripts repaired**, **unstable**, **by hand**, **not run** (and why), each as one line per scenario;
   - **Changed in the pack this run**: added, reworded, left out;
   - **Seen on the way** — what the recorder or a replayer noticed that is not a regression (a typo, an odd message): one line each, for the next sweep. Not investigated here.
2. Commit the pack, its scripts with `tests/regression/manifest.json` and the report, as one commit (`test(regression): <what changed>`), with no product code in it. Nothing changed and everything passes → no commit; the final message is enough.
3. Final message, ≤ 10 lines: the verdict, what is broken, what needs the human, the path of the report.

## How the other commands use the pack

- `/forge-sweep` plays it first (`regression.mjs run`), before its guards: a failure is a `regression` finding of the sweep, fixed like any other.
- A task that changes a flow a scenario walks says so at close (`forge/packs/core/skills/forge-pilot/scrum-worker.md`), so the next `/forge-regression` re-records it.
- Before a release, or in CI: `node forge/packs/core/tools/regression.mjs run` alone — exit 0 means every scenario ran and passed. No model is needed while everything is green.

## Anti-goals

- No scenario reworded, and no script bent, to turn a failure green
- No code, selector or command in `docs/regression.md` — it is the human's file
- No product code changed; no push, no merge
- No script recorded that was never seen to fail
- No scenario that depends on another one having run
- No pack of fifty scenarios: what is not vital belongs to the sweeps
- No "all green" that hides scenarios not run, by hand or out of date — name them
- No run against data that is not disposable
