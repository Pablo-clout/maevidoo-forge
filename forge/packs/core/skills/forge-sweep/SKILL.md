# Skill: /forge-sweep

**Purpose:** The periodic deep check of the **whole running app** — typically once a week, from a scheduled job: every big feature is walked for real, the UI is judged as a whole, the defects found are fixed on a branch, and the human gets one report to read in the morning — an illustrated page with every defect's capture before and after.

`/forge-pilot` judges one change. This judges what the changes of the week did to everything else. **It is the bulldozer: thorough on purpose, and expensive on purpose** — every feature, every screen, down to margins and wording. It runs when nobody is waiting, so it does not economise on coverage; `light` is there for the weeks when the budget matters more.

**It converges.** It can run every night on the same code without rewriting the same screen every night. Testing stays exhaustive; what changes is what it allows itself to change:

- it replays what it already fixed first;
- it counts only what it can reproduce twice;
- it fixes only toward an objective target;
- it never undoes an earlier sweep;
- it does not re-ask a question that is still waiting.

A night on unchanged code whose defects are fixed ends with *nothing to fix*. Rule: `forge/packs/core/rules/sweep-ledger.md`.

**Scheduling** (cron, CI, headless run): `docs/weekly-sweep.md`.

## Inputs

- Nothing (the whole app), or feature names or **area names** to limit the run. A project with areas, nothing said and a human present → main asks which area first (`forge/packs/core/rules/areas.md` § 3b); a scheduled run takes the whole app. Optional words: `report-only` (find, do not fix) · `light` (UI review only on screens changed since the last sweep; no fixing of Lows) · `max-features <n>`.
- Read first: the sweep queue, `node forge/packs/core/tools/sweep-queue.mjs list` (it reads `epics/to-sweep.md` and orders it by need: not judged, then light, then the rest).
- Read: `forge/project.md` (`commands.dev`, `commands.url`, `commands.test`, optional `commands.reset`), `docs/features.md` (the feature map), the latest report under `epics/sweeps/`, `docs/sweep-ledger.md` and `docs/ui-canon.md` when they exist (created on the first run that needs them — templates `forge/packs/core/templates/sweep-ledger.md`, `forge/packs/core/templates/ui-canon.md`).
- **The latest chaos report**, `epics/sweeps/chaos-*.md`, when there is one: each of its open *Real problems* is replayed first, with the guards (§ 2), from its replay file or its steps. One that still shows is a finding of this run (`why: found by /forge-chaos-sweep`), fixed like any other, and its fix becomes a guard.
- **The report's language** is the one the human writes in: look at `epics/memory.md`, `epics/decisions.md` or the README — French notes mean `lang: fr`. Set it in the data file; never default to English when the notes are in another language.
- Read: `forge/packs/core/rules/shell-commands.md` — main and every agent it spawns: never wait in a loop, read while a command runs.
- Rules reached later: `forge/packs/core/rules/execution-contract.md` § Severity; `forge/packs/core/rules/areas.md` § 3b when `forge/project.md` has `areas`, § 4 when it has none; `forge/packs/core/rules/asking.md` (interactive runs only).

**It never waits for a human**, the area question of an interactive run aside. A scheduled run has nobody to ask: every decision it cannot take goes under *Needs you* in the report, and it carries on with the rest.

## Who does what

Main orchestrates and writes the report; it tests nothing and fixes nothing itself. Every tester and every fixer is a fresh agent spawned by main (no nested spawns), ≤ 3 at once, on the parent's model unless `forge/project.md` says otherwise. Each gets a scratch folder of its own for throwaway scripts and output — two agents never share one.

## Procedure

### 0. Before anything
1. **Clean tree.** Uncommitted changes → stop, report `not run — working tree not clean`. A sweep never mixes with work in progress.
   `.gitignore` has no `epics/sweeps/*/` line → add it and commit it alone (`chore: keep sweep galleries out of git`): the illustrated report and its captures stay on the machine, only the text report is versioned.
2. **Disposable data only.** The sweep creates, edits and deletes records. `commands.url` is not a local address (`localhost`, `127.0.0.1`, `*.localhost`, `*.test`) and `forge/project.md` does not say `sweep_data: disposable` → `report-only`, and the testers only look: no flow that writes.
3. Create the branch `forge/sweep-<YYYY-MM-DD>` from the current one. Everything the sweep commits lands there. **Never push, never merge.**
4. Run `commands.test` (and `commands.build` / `commands.lint` when set). A red result is finding 1 and does not stop the sweep.
5. Start the app once (`commands.reset` first when set). Main owns it: testers neither start nor stop it. It will not start → report `not run — app does not start` with the error, stop.

### 1. The feature map — `docs/features.md`
The list of what the app is for, feature by feature (template `forge/packs/core/templates/features.md`): entry point, the flows a user runs there, the data it needs, `core: yes` when the product is useless without it.

- **Missing** → build it now: README and docs, routes and navigation in the code, `epics/decisions.md`, then open the app and write down what a user can actually do. 5 to 15 features, 3 to 8 flows each — group, do not list every button. Mark it `status: draft — unconfirmed`. An interactive run shows it to the human once; a scheduled run uses it as is and says so in the report.
- **An older layout** (a feature map, a UI canon or a sweep ledger still beside `forge/project.md`): move them first, as `forge/packs/core/rules/product-docs.md` § 0.1 says, and say so in the report.
- **Read `docs/vision.md` first**, when it exists: it says what the product is meant to do, and a feature of the app that contradicts it is reported as a vision proposal at the end of the run, never settled by the sweep (`forge/packs/core/rules/product-docs.md` § 2).
- **Every change to the map is a proposal** (`forge/packs/core/rules/product-docs.md` § 3): written `status: proposed`, told to the human with its reason, accepted or refused by them. A proposed feature is walked like a confirmed one, and nothing is removed from the map without the human.
- **Off the map** (`forge/packs/core/rules/product-docs.md` § 4): compare the map with the app's real navigation and routes; what is on no feature is walked after the fixed part, and the report says what was found there, or that nothing was.
- **Present** → check drift: a screen or route that exists and is on no feature is added as `new — unconfirmed`; a feature whose entry point is gone is reported, not silently dropped.

The flows of the map and their order are the **fixed part** of every run: the same code walked twice is walked the same way. A flow a tester adds while exploring is proposed for the map (`new — unconfirmed`) rather than improvised again next time.

**The sweep queue — `epics/to-sweep.md`.** Every closed task left one line there: what shipped, with which command, and who judged it. These are the features to test hardest, because they are new and some were never judged:
- **Order**: the queued features come **first**, `judged: no` before the others (`lite` and `/forge-debug` work was only checked by its author), then `judged: light` (`/forge-light`: one short tester). Then `core` features, then the ones touched since the last sweep (`git log` since the commit the last report names), then the rest. `max-features` never cuts a queued feature.
- **Depth**: the tester of a queued feature gets the line, plus the matching entry of `epics/decisions.md` (what was built, why, the assumptions). It walks each point of *Check in particular* as a flow of its own, then the feature's usual flows and its neighbours. For `judged: no` and `judged: light`, it does everything a pilot's flow tester and UI reviewer would have done on that task.
- **A queued change missing from the map** (a new feature or screen) → add it to `docs/features.md` as `new — unconfirmed`, and walk it.
- **No queue file** (first sweep, or a project that predates it) → fall back on `git log` since the last sweep.

### 2. Replay the guards — before any exploring
**The regression pack first**, when `docs/regression.md` exists: `node forge/packs/core/tools/regression.mjs run --json <scratch>/regression.json` (`--area` on a run limited to an area), in the background while the guards start. A scenario that fails is replayed by hand by its feature's tester, from the scenario's text (`forge/packs/core/skills/forge-regression/SKILL.md` § 4): the app is broken → a `regression` finding, High at least, fixed like any other; the script or the scenario is out of date → one line under *Needs you* naming `/forge-regression`. The report carries `regression pack: 18 / 20`. Scenarios not run are named, never counted as passing.

Every `fixed` entry of the ledger is a guard: its reproduction steps, and its capture command when it is visible. One fresh agent (or the flow testers, each for its own feature, as their first job) replays **every guard** of the features swept, after `commands.reset`, with the probe in `--stable` mode.
- Passes → one line in the report (`stability.guards: 38 / 38`).
- Fails → a `regression` finding, one severity level higher, with the guard's entry id. It is fixed like any other.

### 3. Sweep
**Per feature, one flow tester** — `forge/packs/core/personas/lenses/flow.md` + `forge/packs/core/skills/forge-flow-test/SKILL.md`, in **deep mode**: every flow of the feature from the map, every variation of the skill's table (none optional here), the full field matrix, and at least one path that crosses into another feature (what is created here shows up correctly there). Give it: the feature's block of the map, the URL, the previous report's open findings on that feature, **the ledger entries of that feature**, and a record prefix of its own (`sw-<feature>-`): the app is shared — it touches only records carrying its prefix. It walks the map's flows first, in their order, then explores. A settled entry (`validated`, `decided`, `asked`) is not re-argued; new evidence against it is reported with the entry's id.

**UI reviewers — where they pay:**
- one per **screen of the features swept, every sweep** — `forge/packs/core/personas/lenses/qa-ux.md`: spacing and margins, alignment, state visibility, readability, at every width (`run-ui-sweep.mjs --between 80` across the canon's width matrix: phone, tablet, desktop, wide), measured with the probe **in `--stable` mode**, on the canon's state matrix when there is one. It gets the screen's canon block and ledger entries, judges consistency against the canon and not against its taste, and gives each finding its kind (`defect | usability | judgement | polish | preference`) and an acceptance line (`forge/packs/core/skills/forge-ux-sweep/rubric.md` — the checks marked **L**). The components are judged with `/forge-ui-detail`: close-ups of each component type side by side at every width, against its principles and anatomy cards. Features that live on the same screen share one reviewer. A screen nobody touched can still have been broken by a shared style or component — that is why all of them are looked at (`light`: only the screens whose code changed since the last sweep);
- **one for the app as a whole**, every sweep: does the product make sense from screen to screen? Same words for the same thing, same place for the same action, navigation that says where you are, nothing a first-time user cannot find, empty and error states that speak, phone and desktop. It follows `forge/packs/core/skills/forge-ui-review/SKILL.md` across screens rather than inside one.

**Other browser engines — a diff beside the sweep, never instead of it.** Everything above runs in Chrome, as before. When Playwright and its engines are installed in the project, main also runs, for each screen in its main state:

```bash
node forge/packs/visual-qa/tools/run-engine-diff.mjs --url <url> --shots epics/sweeps/<date>/img/engines/<screen> --json <scratch>/engines-<screen>.json [--before "<state>"]
```

It runs the same probe in Chromium, WebKit and Firefox and prints **only what differs from Chromium**: a sideways scroll or an error in one engine only, a probe finding in one engine only, a component that renders at another place or size. It is mechanical and costs no agent.
- **No difference** → one line in the report (`engines: webkit, firefox — no difference on n screens`).
- **Differences** → one UI reviewer gets the screens that differ, with the two screenshots, confirms each difference and reports it as a finding with the engine in `where` (`Gear · WebKit, 390px`). An overflow or an error in one engine only is High.
- **The tool exits 3** (Playwright or an engine not installed) → skip, and say so under `notTested`: `Safari / Firefox rendering — engines not installed`. Never a failure.
- Playwright's WebKit is not Safari on an iPhone: what belongs to iOS itself (keyboard, address bar, zoom, sharing) stays under `notTested` until someone tries a real phone.

Each returns findings in the shape of `forge/packs/core/rules/execution-contract.md` § What every judge returns, with for each finding the exact steps to reproduce, and:

- **A capture of every defect that can be seen** — what the user sees when it happens, not the whole page: `node forge/packs/visual-qa/tools/run-ui-probe.mjs --url <url> [--mobile] [--before "<steps>"] [--block "<url part>" --block-at-load] --screenshot <its scratch folder>/<name>.jpg --clip "<css selector of the area>"`, at the viewport where it shows.
- **The exact command that produced it**, copied in the finding (it becomes `capture` in the data, with `<img>` where the file name goes): the fixer's verifier re-runs it on the fixed code to take the *after* capture in the same place, size and state. A defect that cannot be seen (data, API, timing) has no capture — say so.

### 4. Consolidate
Main merges what came back — it does not re-judge:
- **Reproduced twice, or it does not count.** Every finding is re-run once, independently, before it enters the report: the steps again, or the capture command from a fresh browser, after `commands.reset` when the data matters. Main hands the list to one fresh agent; a tester's own second run does not count. Not reproduced → `stability.flaky`, with its steps: not counted, not fixed. Third sighting over several nights → a finding.
- **One defect, one line:** the same root cause seen from three features is one finding with three sightings. Two judges gave it different severities → keep the higher; several sightings do not raise it by themselves.
- **Against the last sweep:** each finding is `new`, `still open` (was in the last report), or **`regression`** (that flow was `ok` last time — raise it one severity level, capped at Critical). Findings of the last report that no longer reproduce are `fixed since`.
- **Against the ledger** (`forge/packs/core/rules/sweep-ledger.md` § 3): each finding is checked against the ledger.
  - A `fixed` entry that is back → `regression`.
  - A settled entry with no trigger → `stability.silenced`, with its id. Never dropped silently, never a defect.
  - A trigger fired → `since: reopened`, citing the entry.
  - A question already `asked` → `stability.waiting`, not a new item under `needsYou`.
- **Kind and target.** A preference becomes a suggestion (at most 3, in `sections`). **Polish findings are recorded, not fixed here.** They stay `open`, with `why: polish — /forge-ux-sweep`. Restyling needs two reviewers who agree and a blind A/B judge, which is that skill's job; a nightly sweep restyling screens is exactly the churn to avoid. Every other finding must have an **acceptance line** with an objective target. A finding without one cannot be fixed: it goes to `needsYou`.
- **The report data:** give each finding its id (`S-1`, `S-2`, … most severe first), copy its capture to `epics/sweeps/<date>/img/S-<n>-before.jpg`, and write `epics/sweeps/<date>/report.json` — format by example in `forge/packs/core/templates/sweep-report.json`. Write `what` (and later `now`) **for the person who owns the product**: what the user sees, in plain words, no code, no selector — the technical detail belongs in `reproduce`. Questions the sweep cannot settle go in `needsYou`, grouped by theme; a finding that is itself such a question has `status: needs-you`. Every finding that is not fixed has a `why` (needs a decision, Low listed only, out of batches, reverted…). `tests` holds two short results (`3 / 3`), detail goes in `runNotes`. `stability` holds the guards replayed and the four lists: `touchedAgain`, `waiting`, `silenced` and `flaky`. The renderer shows them in their own section.
- **Render** it: `node forge/packs/core/tools/sweep-report.mjs epics/sweeps/<date>/report.json` writes `epics/sweeps/<date>/index.html` (illustrated, not in git) and `epics/sweeps/<date>.md` (text, committed). Fix every warning it prints. Commit the `.md` now, before any fix: if the run dies later, the findings are not lost.

### 5. Fix (skipped with `report-only`)
**What gets fixed automatically:** Critical, High and Medium findings addressed to `code`, and the **Lows that are pure presentation** (a margin, an alignment, a contrast, a clipped or wrapping text, a tap target, a missing label or focus style). These are cheap, low-risk, and exactly what piles up when nobody looks. Not with `light`. Each must have an acceptance line with an objective target (a threshold, a canon value, a behaviour that can be checked). This is what makes fixes idempotent: once the target is met, the next run measures it and has nothing to do. A presentation Low whose only target is "would look better" is a suggestion, not a fix.  
**What never is** — it goes under *Needs you*: a finding that needs a product decision (`human`); anything in authentication, permissions, payments, personal data, a data migration or a schema; a fix that would add behaviour nobody asked for; a change of wording, layout or flow that is a matter of taste rather than a defect; the other Lows (listed, not fixed).

1. Group the findings to fix into **batches**: same part of the code — in a project with areas, the same area, and the shared code in a batch of its own, last (`forge/packs/core/rules/areas.md` § 3b) — at most 5 findings each (presentation Lows: up to 10 in a batch of their own, one batch per screen; one that spans screens goes with the first). A finding that another batch's change already fixed is marked fixed with that batch's commit, not fixed twice. At most **8 batches per sweep** (`light`: 4) — most severe first, presentation Lows last; the rest stays open in the report. Batches run one after the other, so two of them may touch the same file (a small app is often one file): each fixer starts from the previous batch's commit.
2. Main stops the shared app: during this step each fixer starts and stops its own. One batch at a time: a fresh Code agent with `forge/packs/core/personas/code.md` + `forge/packs/core/personas/code-fix-round.md`, the batch's findings and their reproductions. It must reproduce each defect first, fix it with the smallest change, **add a regression test wherever the project has a test harness for that layer**, run `commands.test` itself (nobody runs it after a sweep fixer — while it works, only the tests of what it touches), and pass the UI probe gate on what it touched. **It never undoes an earlier sweep**: before handing over, it runs `git blame` on the lines it changed. A change that reverses a line written by an earlier `fix(sweep)` / `fix(ux-sweep)` commit, or that touches an element a `validated` or `decided` entry covers, is dropped. That finding becomes `needs-you: would undo S-n of <date> — which one is right?` (rule § 1.5). A real defect on a settled element still gets its fix, as long as the earlier entry's acceptance line stays true; it is listed under `stability.touchedAgain` with its reason. Its reply gives, per finding, one plain sentence of what the user sees now (`now` in the data).
3. Main commits each batch as its own commit on the sweep branch (`fix(sweep): <what> [S-<n>, …]`), so one fix can be reverted without the others.

### 6. Verify the fixes
Main starts the app again on the fixed code. One fresh flow tester walks again **only** the flows of the fixed findings and their neighbours (round-2 rule of the flow-test skill).
It also re-runs the **capture command of every fixed finding** that had one, unchanged except for the file name, into `epics/sweeps/<date>/img/S-<n>-after.jpg`.
- Finding gone, neighbours fine → `fixed` (verified), with its commit.
- A **new** defect the verifier meets while re-walking is added as a new finding — `status: open`, `why: found while checking the fixes` — and waits for the next sweep: no second fix round in the same run.
- Still there, or a neighbour broke → main **reverts that batch's commit** and marks its findings `fix failed — reverted`. If the revert conflicts with a later batch on the same file, that later batch is reverted too and marked `reverted with S-<n>`. No second attempt in the same sweep.

### 7. Close
1. **Update the sweep queue**: for each queued commit this run covered, `node forge/packs/core/tools/sweep-queue.mjs swept --commit <sha> --by sweep --result "ok"` (or `"n findings"`). Add `--done` to remove the row when no screen changed, or when a UX sweep has covered it too. A queued feature that was not walked keeps its line, and the report names it.
2. **Update the ledger** (`forge/packs/core/rules/sweep-ledger.md` § 4):
   - every verified fix becomes a `fixed` entry (a guard) with its `reproduce`, `capture` and `acceptance`;
   - every judgement kept becomes `validated`;
   - every new question becomes `asked`;
   - every human answer becomes `decided`;
   - every suggestion not taken up becomes `declined`.
   Add new screens to the canon.
3. Complete `epics/sweeps/<date>/report.json` — final statuses, commits, `now`, the after captures, `notTested`, `next`, `runNotes`, tests before and after — and render it again (no warning left). Update `docs/features.md` (`last swept: <date> · ok | n findings`, drift notes) and add one dated line to `epics/decisions.md` pointing at the report (create the file if the project has none). Commit them on the sweep branch: `epics/sweeps/<date>.md`, the map, the journal, the sweep queue, the ledger, and the canon when it changed.
4. Stop the app and go back to the branch the run started from. **Commit the same files there too, as one commit that contains no code** — the report must be where the human looks in the morning, whether or not they merge the fixes.
5. Leave the tree clean. **The sweep branch stays unmerged**: reviewing and merging it is the human's morning job. Nothing was fixed → delete the sweep branch.
6. Final message, ≤ 15 lines: features swept, queued features covered (and how many were unjudged), guards replayed (and failed), findings by severity (and how many are regressions), fixed / reverted / left open, what needs the human, **the path of `epics/sweeps/<date>/index.html`** (the page to open in the morning), the text report and the branch name.

## Anti-goals

- No code change on the branch the run started from (the report, the map and the journal line are the only things committed there); no push, no merge, no pull request
- No fix for a finding that was not reproduced, and none without re-walking it afterwards
- No waiting for an answer in a scheduled run; no guessing a product decision either — *Needs you*
- No writing flows against data that is not disposable
- No "everything works" for features that were not walked — name them; a run on one area names the cross-area journeys it did not walk
- No silence on a project that shows the signs of an uncut project: one finding for the human, once (`forge/packs/core/rules/areas.md` § 4)
- No hand-written HTML report: the renderer makes it, from the data file
- No captures or illustrated report in git — only the text report
- No rewrite, refactor or dependency upgrade in the name of a finding
- No fix toward an opinion: every automatic fix has an objective target, and none undoes an earlier sweep's fix or a settled decision
- No finding that was seen once and never reproduced; no question re-asked in new words; nothing silenced without being named in the report
