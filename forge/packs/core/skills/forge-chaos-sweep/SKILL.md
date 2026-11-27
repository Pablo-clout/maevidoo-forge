# Skill: /forge-chaos-sweep

**Purpose:** The last net, for an app that is already stable. Several cheap, fast testers are let loose on each workflow of the app, with one instruction: behave like a careless human, not like the perfect user, and say whether this holds up. Each tester chooses what to try, replays its own findings before reporting them, and returns a short argued report. The session's own model checks what they say. The human gets one report: for each workflow, a feeling (works, shaky, broken) and the confirmed problems, each with its steps. It fixes nothing.

What it is for: **a human feeling of whether the app works**, reached fast, by people who do not follow the script. It is not for quantity, and not for completeness: `/forge-sweep` and `/forge-ux-sweep` remain the thorough checks, and `/forge-flow-test` walks each flow as a careful user. This skill finds what careful users never meet: a search that filters nothing, a "Saved" that saved nothing, a form that breaks on the third hurried click, a loan lost because a name had an apostrophe.

How it stays honest:
- **a tester replays its own finding** twice from a fresh page before it may report it;
- **nothing without evidence**: the text on screen, the error, or a screenshot;
- **no tester is believed alone**: main checks what testers disagree on, and what only one of them saw;
- **the tool goes first** where no judgement is needed: blind, seeded walks that cost no tester.

Measured on a test app with twenty planted problems, on a cheap model: ten generalist testers found 8, fifteen specialists (one of ux, design and workflow per workflow) found 17, and of their 67 findings 2 were false. Testers given a step-by-step procedure found nothing the tool had not. Details: `docs/chaos-sweep.md`.

## Inputs

- Nothing (every workflow), or workflow, feature or **area names** to limit the run (an area of the project, `forge/packs/core/rules/areas.md` § 3b — not the `--areas` option of `chaos.mjs`, which takes workflows). Optional words:
  - `tool-only`: the blind walks of § 2 only, with no tester;
  - `testers <n>` (per workflow), `at-once <n>`: override what `forge/project.md` holds;
  - `no-code`: skip the code readers of § 2b; `readers <n>`: how many (default 5);
  - `no-journeys`: skip the journey testers of § 2c.
- Read:
  - `forge/project.md` (`commands.*`, `sweep_data`, `chaos`, `areas`);
  - `forge/packs/core/rules/shell-commands.md` — main, and the one rule passed to every tester: never wait in a loop;
  - `docs/vision.md` (what the product is meant to be), `docs/features.md` (the workflows) and `docs/ui-canon.md` when present;
  - `docs/sweep-ledger.md` and the latest `epics/sweeps/chaos-*.md` (what is already known);
  - `angles.md`, `worker.md`, `specialties.md`, `code-reader.md` and `journey.md`, next to this file.
- **The report's language** is the one the human writes in.

## Who does what

- **Main** lists the workflows, deals them, spawns the testers, checks their findings and writes the report. It is the session's own model: the one the human chose to talk to.
- **Testers** are fresh agents, each with one workflow and one **specialty**: `ux` (how it feels to use), `design` (how it is made to look) or `workflow` (does the whole thing hang together). Their brief is `worker.md`; each reads its own section of `specialties.md` and the reference files it names, and nothing else: no code, no ledger, no other tester's report. They return their report as their final message.
- **Code readers** are fresh agents on the testers' model, each with one part of the code. Their brief is `code-reader.md`: they read like a junior who has just joined, the documents and the comments first, think again before reporting, and never touch the running app. They and the testers never see each other's reports.
- **Journey testers** are fresh agents on the testers' model, each a person on a whole errand (`journey.md`): the hurried one, the anxious one, the interrupted one, the one who gets it wrong, the one who cannot hold everything in their head. They read no code; they do read what the product decided.
- **The testers' model is the human's choice, never Forge's.** Forge names no model anywhere. See § 1.

## Procedure

### 0. Before anything — safety
Chaos is destructive by design. Do what `forge/packs/core/skills/forge-sweep/SKILL.md` § 0 says (clean tree, disposable data only, `commands.reset`, the app started once by main), and in addition:
- **Refuse to run** unless `commands.url` is local (`localhost`, `127.0.0.1`, a private address), or `forge/project.md` says `sweep_data: disposable`. Say why, and stop. Never production, never real users' data.
- No real email, payment or message may leave: when the project sends any, they must be stubbed in the test setup. If that cannot be shown, the workflows that send them are left out and named under *Not tested*.
- **One test account per tester** when the app has a login (`chaos.accounts` in `forge/project.md`, or a seed command). Testers that share an account log each other out and corrupt each other's forms: with fewer accounts than testers, lower the number of testers.
- `commands.test` first. Red → stop: chaos is for a stable app; run `/forge-debug` or `/forge-sweep` first.

### 1. The plan — workflows, testers, model
1. **Workflows.** A workflow is one thing a user comes to do: *create a tournament*, *add a match*, *read the statistics*, *invite a parent*. Take them from the flows of `docs/features.md`; without that file, from the navigation and the routes, 5 to 20 of them. Each is one line and a starting URL, plus the account or the state it needs. Do not cut a workflow into its fields and cases: that is the tester's freedom.
   - **Off the map**: set the map beside the app's real navigation and routes. What the app offers and no workflow mentions is the off-map list (`forge/packs/core/rules/product-docs.md` § 4). It becomes **one more workflow**, "what is written nowhere", starting at the home screen, given to one tester with the `workflow` specialty. With no map at all, the whole run is off the map, and it ends by proposing one.
2. **How many testers, and which model.** Look it up first (`forge/packs/core/rules/asking.md`): the request, then `chaos` in `forge/project.md`. What is still open goes in **one question, through the host's question tool**:
   - *The testers' model*: offer the cheapest models **this host lists**, cheapest first. Forge holds no list of models and suggests none by name on its own; if the host shows no choice, the testers inherit the session's model, and the question says so.
   - *How many testers*: default one per specialty for each workflow, so `workflows × 3`. Show the total and what it means: `5 workflows × 3 specialties = 15 testers, 5 at once`. Two testers with the same workflow and the same specialty bring little: on the test app they shared most of their findings, while three specialists on one workflow found almost twice what two generalists did.
   - *Which area*, when the project has areas and the request names none (`forge/packs/core/rules/areas.md` § 3b): the same call. The number of testers shown is the one for the answer given. This answer is for this run only and is not recorded.
   Record the answer under `chaos` in `forge/project.md`, so a scheduled run does not ask again. A scheduled run with nothing recorded runs `tool-only` and says so.
3. **Deal**: `node forge/packs/core/tools/chaos.mjs deal --dir <scratch>/chaos --areas "<workflow>=<url>,…" --workers <n> --angles ux,design,workflow --temperaments impatient,clumsy,curious,stubborn,distracted,hostile,newcomer --run <number of chaos reports so far + 1>`. Each tester gets a workflow, a specialty, a **temperament** (`angles.md`) and a main screen width. No two testers share a workflow and a specialty, and the run number turns temperaments and widths, so the next run meets each workflow differently.

### 2. The blind walks — the tool, before any tester
Main runs `node forge/packs/visual-qa/tools/run-chaos.mjs` on each workflow's starting URL under each of its six angles (`angles.md` § Tool angles), then `chaos.mjs note --run` and `chaos.mjs triage`. No tester is involved: a walk takes about 20 seconds, and several can run side by side. It catches what needs stubbornness and no judgement: an uncaught error on the third click, a 500, the same write sent twice, a typed value run as script.

Each signal is replayed once (`run-chaos.mjs --replay <run.json> --upto <step>`); one that does not come back is set aside. `tool-only` stops here and goes to § 5.

### 2b. The code readers — a junior's reading of the code
Skipped with `no-code`, and when the repository holds no code of the app.
1. **Cut the code into parts**, 5 by default, each one thing a newcomer could hold in mind (about 1,500 to 4,000 lines): by layer and by domain, such as *server: accounts and access*, *server: orders and money*, *browser: shared helpers and the customer side*. Generated files, dependencies and tests are left out. Each part has a kind: `server`, `browser` or `other`.
2. **Spawn one reader per part**, with `code-reader.md` and its part: name, files, kind. Nothing is added: no hint of what to find, no tester's report. They count in the waves and the caps of § 3, and they can run while the testers do.
3. A reader returns at most 8 findings, each with `sev` and `sure`, the suspicions it dropped after re-reading, and its opinion of the code as a newcomer.

Measured on a real app of 14,700 lines, five readers on a cheap model: 23 findings, 21 real, none false, for a third of the swarm's cost; among them a high defect and two medium ones that thirty testers had missed, and eleven that nobody else had found. They missed defects lying in their own part, and one stated a check it had not made. Details: `docs/benchmarks/sweeps-vs-market-realistic-2026-11-19.md`.

### 2c. The journeys — five persons, each on a whole errand
Skipped with `no-journeys`. A tester of § 3 stays inside one workflow for a few minutes. A journey tester crosses several, with a goal, and counts what it costs.
1. **Write five errands**, one per person of `journey.md`, each crossing at least three workflows of the map from a real starting point to a real end (the request made, the thing delivered, the money settled), with the accounts it needs. The errand of *the one who gets it wrong* names one ordinary mistake per stage; that of *the interrupted one* names where it is cut and by which ways it comes back.
2. **Spawn one tester per errand**, with `journey.md`, its person, its errand, its own account or its own copy of the data, and the documents that say what the product decided (`docs/vision.md`, `docs/features.md`, a specification when there is one). They count in the waves and the caps of § 3.
3. A journey tester returns the effort of the whole errand (screens, clicks, fields), at most 8 findings, each with a counted cost and whether the documents are silent, and what went well.

Measured on the same real app, five journey testers on a cheap model: 31 findings, 27 distinct and real, none false, 18 that no other method had found, for a fifth of the swarm's cost. Their own kind of finding: what an ordinary mistake costs to undo (two could not be undone at all), and where the app is silent about money or about what happens next. They announced six `sev 3`; main kept none as high.

### 3. The testers — in waves, a few first
Many agents at once can hit the host's limits: they share the session's rate limits, and a host refuses agents past its cap (Claude Code: 20 at once by default). So:
- **Wave 1 is a pilot of 3 testers.** Main notes what each cost (tokens and time, when the host reports them) and whether each returned a report in the asked shape. One that did not → fix the setup before going on.
- **Projected cost**: pilot average × testers left. When it is more than twice what the plan question announced, ask again before going on (question tool).
- **Then waves of `at_once`** (default 5), never above the host's cap.
- **On a limit or concurrency error: never retry in a loop.** Halve `at_once` and go on. A second error → stop spawning, finish with what has returned, and say in the report which testers did not run.
- **Stop early when a wave brings nothing new**: every finding of the wave was already reported by an earlier tester. The remaining testers of those workflows are not spawned, and the report says so.
- Each tester's prompt names `worker.md` and gives its five things: workflow with its URL, specialty, temperament, main screen width, budget; and its account when there is a login. Nothing is added: no list of cases, no hint of what to find. Nothing is added to it: the brief is short on purpose, and the tester's freedom is the method.
- **Machine-readable contract (optional, host-neutral):** `waves.contract.json` encodes these exact wave, backoff, early-stop, and blind-isolation rules (`shared_board: false`), and `finding.schema.json` encodes the exact output shape of `worker.md`, `code-reader.md`, and `journey.md`. Any harness can split waves deterministically with `node forge/packs/core/tools/chaos.mjs plan-waves --dir <scratch> --json` and validate JSON worker outputs with `node forge/packs/core/tools/chaos.mjs validate-report --file <report.json>`. Hosts that ship a deterministic workflow engine (such as Antigravity `/run-workflow` or Claude Code's Workflow tool) may drive § 2b, § 2c, and § 3 from these two files: with an engine, the worker is asked for JSON matching `finding.schema.json` and the brief still gives the meaning of each field; without an engine, do not load the JSON files and the text shape in the brief stands unchanged.

### 4. Check — main, not the testers
The testers already replayed their own findings. Main does not redo everything; it goes where a tester is most likely to be wrong:
1. **Merge.** The same problem reported by several testers is one finding, `seen by n`. Add the tool's confirmed signals of § 2.
2. **Apply what is already known**, as `forge/packs/core/rules/sweep-ledger.md` § 3 does: a finding the ledger holds as `decided`, `validated` or `deferred` is silenced and named; one that the last chaos report lists as open is `still open`.
3. **Sort by the testers' two numbers.** Every finding carries a severity (`sev` 1–3) and how sure the tester is (`sure` 1–3). They are the tester's opinion, and they order main's work:
   - `sev 3` is always checked by hand, whatever `sure` says;
   - `sure 1` is a pointer, never a finding by itself: main looks, or leaves it under *Seen once*;
   - `sev 1` with `sure` 2 or less is listed and not checked, unless several testers say it;
   - main records, for the report, how often each level of `sure` turned out right. A tester's `sure 3` that proves false is named.
4. **Check by hand, in the browser**, in this order:
   - what two testers of one workflow **contradict** each other on (one says the message never shows, the other quotes it);
   - every finding **seen by one tester only** that would block or hurt a user;
   - anything whose evidence does not show what the tester says.
   On the test app this caught the false statements, all of them in those three groups. The commonest cause: a tester quoting text that is in the page but hidden, which its own replay repeats faithfully. A tester's replay removes accidents, not misreadings: this check is what removes those.
5. **Decide** each checked finding: **real** (with a severity, `forge/packs/core/rules/execution-contract.md` § Severity), **false** (the app is right, or the tester did not do what it says), or **unclear** (a product decision → *Needs you*). A finding seen by two testers or more, with evidence, stands without a hand check unless it is High.
6. **Outside my specialty.** Each tester lists in one line what it noticed that belongs to another specialty. When the specialist of that workflow reported it too, it is a second sighting. When nobody did, main looks once.
7. **The map and the vision.** What the testers met that is on no workflow is proposed for `docs/features.md`; what contradicts `docs/vision.md` is a vision proposal. Both are shown and asked at the very end, after the report is written (`forge/packs/core/rules/product-docs.md` § 2 and § 3); a scheduled run lists them under *Needs you*.
8. **The code readers' findings**, with pincers: a junior read this.
   - Main opens the file at the line and follows the path itself. A finding the app can show is replayed in the browser, and then stands like a tester's; one it cannot show (a race, a rare input) stands only when main has read the whole path, and the report says `read in code`.
   - Main sets the severity itself, from the consequence. Readers under-rate what they do not see the reach of (a redirect, an export) as often as they over-rate.
   - A reader's "I checked X and it is right" is no evidence: it is not reported as coverage.
   - **Before a finding is set aside, ask why a careful newcomer believed it.** When the answer is that the code or the documents did not say something (why a check is absent, that a behaviour is wanted, what clears a piece of state), that is a finding about the documentation: it goes under *Documentation for the next reader*, with the line that would have prevented it. The same question is asked of what a reader dropped wrongly.
   - The readers' *where I got lost* lines that point at the same place as a real finding are listed with it: that is where a comment is owed.
9. **The journey testers' findings.**
   - Main replays the costly ones and sets the severity itself: a journey tester feels its person's trouble and rates it high.
   - A finding whose `docs:` line says `silent` is **a decision for the product's owner**, not a defect: it goes under *Needs you*, worded as the question to settle (may a clerk correct a serial after pickup? how does the customer learn the request is confirmed?). One whose documents ask for the behaviour while the screen does not say so is a defect of wording, and is listed with the real problems.
   - The effort lines (screens, clicks, fields per errand) go in the report as they are: the next run compares with them.
10. **Steps.** Every real finding keeps the tester's steps, corrected when the check showed they were inexact: from a fresh page, short enough for `/forge-debug` to follow.

### 5. Report and close
1. Write `epics/sweeps/chaos-<date>.md` from `forge/packs/core/templates/chaos-report.md`, for the person who owns the product:
   - **per workflow, the feeling**: what each tester said (`works`, `shaky`, `broken`) and main's one line after the check;
   - the real problems, most severe first, each with its steps and its evidence;
   - findings by specialty (ux, design, workflow), and how often the testers' `sure` was right;
   - **the journeys**: per person, the errand, its effort, whether it could be finished, and its findings;
   - **the code as a newcomer reads it**: the readers' two marks per part, the real findings they brought, and *Documentation for the next reader*;
   - what was checked and found false, what was seen once, what was not tested;
   - the score: testers run, findings raised, merged, checked, real, false; and what the run cost when the host reports it.
   Copy the replay file of each real signal of the tool to `epics/sweeps/chaos-<date>/` (git-ignored, like the other sweep folders).
2. One dated line in `epics/decisions.md`. Commit the report and the journal: one commit, no code.
3. **Delete the scratch folder**: deal, notes, walks, the testers' scripts and captures (keep only the captures the report cites, moved to `epics/sweeps/chaos-<date>/`).
4. **Final message**, 12 lines or fewer: workflows and testers run; the feeling per workflow in one line each when few, else the count of works / shaky / broken; the real problems by severity; what was false; what was not tested; the cost; what needs the human; the report's path.

The fixes are not this skill's job: `/forge-debug <finding>` follows the steps and fixes it, and the next `/forge-sweep` reads the chaos report, replays every open finding first, and records each fixed one as a guard in the ledger.

## Anti-goals

- No run against anything that is not local or marked disposable. No real email, payment or message.
- No model named or preferred by Forge. No number of testers the human did not see.
- No thirty testers at once, no retry loop on a limit error, no tester spawned after a wave that brought nothing new.
- No script for the testers: no checklist of cases, no list of what to find. A specialty says where to look and what good looks like; the tester decides what to try. A tester told what to do step by step finds what the tool finds.
- No perfect-user walk: that is `/forge-flow-test`.
- No code reader told what to find, and none given the testers' reports. No reader's finding reported without main having read the path.
- No finding a tester did not replay itself. No finding without evidence. No tester's word taken alone on what blocks a user.
- No fix, no code change, no push. No tester file left after the close.
