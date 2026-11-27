# Skill: /forge-init

**Ceremony:** lite (bootstrap once per repo)

## Goal

Create or refresh `forge/project.md` so packs and visual QA can be routed, bring the project's own documents to one layout outside `forge/`, and write `docs/vision.md` with the human: what the product is, where it is going, its big features, its architecture and its UI and UX direction (`forge/packs/core/rules/product-docs.md`). Do **not** implement features here.

## Inputs

- Optional: user hints about stack (frontend, backend, visual QA).
- Repo files: manifests (`package.json`, `pom.xml`, `build.gradle*`, `*.csproj`, `Cargo.toml`, `go.mod`, `pyproject.toml`, `composer.json`) if present.

## Procedure

### 1. Scan (**on main** — no subagent)

`/forge-init` is a **short one-shot bootstrap**. Run the whole skill on the **main agent**. Do **not** spawn a Task/subagent for init (unlike `/forge` orient/ground).

Look for dependency/manifest signals. Produce a short inventory (max ~15 lines):

- Likely languages/frameworks
- Whether a UI seems present
- Whether tests tooling is visible

Do **not** dump large file contents into chat.

### 2. Ask up to 6 numbered questions (stop and wait)

Exactly these six, in this order — skip any the scan or user hints already answered (say `Q3 skipped — Angular detected`); never re-ask, never add more. One conditional Q7 may follow in step 5. The questions about the project's documents come in step 4.

Ask through the host's question tool (`forge/packs/core/rules/asking.md`) — the lists below are the options; hosts cap a call at about 4 questions, so use two consecutive calls. The tool supplies "Other" itself. No question tool → chat fallback: A/B/C + **D) Other (specify)**, user may answer like `1A, 2D: Vite+Vue, 3B`.

1. Primary frontend stack?  
   A) None / backend-only  
   B) React/Next  
   C) Angular (enables pack `angular`)  
   D) Other (specify)
2. Primary backend stack?  
   A) None / frontend-only  
   B) Node  
   C) Java/Spring (enables pack `java`)  
   D) Other (specify)
3. Optional packs? (multi OK — stack packs already covered by Q1/Q2; recommend `safety`)  
   A) None  
   B) `safety` **(Recommended)** — DB/exfil/secrets policy + optional hard deny (`forge/packs/safety/install.md`)  
   C) `hooks` — Cursor mechanical shell deny wrapper (`forge/packs/hooks/install.md`; prefer with `safety`)  
   D) Other (list ids — e.g. `visual-qa`, `product-plus`, `memory-bridge`)
4. Visual QA?  
   A) off  
   B) optional  
   C) required
5. How much ceremony by default? (per task you can still say `min` / `normal` / `strict`)  
   A) auto **(Recommended)** — Forge picks per task from its risk and raises it if a run goes wrong  
   B) lite — plan + code, no review  
   C) standard — one fresh review on every task  
   D) governed — review + specialised lenses on every task
6. Project display name?  
   A) Keep folder name  
   B) Other (specify)

Max **one** follow-up round if answers are incomplete. Then proceed.

### 3. Write `forge/project.md`

Overwrite/create using schema in `forge/project.schema.md`:

```yaml
version: 1
name: <name>
profiles:
  ceremony_default: <auto|lite|standard|governed>
  worker_tier: <strong|fast>   # the model that writes code here; fast when unsure
packs:
  enabled:
    - core
    # optional packs from answers — only ids that exist under forge/packs/
visual_qa: <off|optional|required>
commands:            # only keys the scan found — never guess a command
  dev: <start script, e.g. npm start>
  url: <local URL, e.g. http://localhost:4200>
  test: <unit test command>
  lint: <lint / type-check command>
  build: <build command>
  e2e: <e2e/visual test command>
knowledge:           # only documents the scan found — never invent one
  - path: <e.g. DESIGN.md>
    when: <ui|data|api|always|path glob>
    about: <one line>
# product_lenses: auto   # default; use `off` only for pure infra repos (never ask per task)
notes: <one line from user free text if any>
```

Rules:

- Always include `core`.
- `worker_tier`: ask nothing — write `fast` unless the user's hints say the coding model is a top-tier one; tell the user in the confirmation that this key drives how much review Forge runs and to change it when they change model.
- `safety` enabled on **Claude Code** ⇒ tell the user the pack is only a written policy until the deny hook is installed, and point at `forge/packs/safety/install.md` (the hook is the part that actually blocks a command).
- `commands`: fill from the scan (package scripts, build files, README run section) — **no extra question**. Omit a key you could not confirm; omit the block if none. In the confirmation, tell the user which commands were detected and that the qa-ux tester needs `dev` + `url` to test the UI itself.
- `knowledge`: fill from the scan — **no extra question**. Look for the documents that say how this project is built: a design direction or tokens / theme file (`when: ui`), a conventions or contributing guide (`when: always`), an architecture document or decision records (`when: always`, or the folder they govern), an API contract or schema (`when: api`), a data model (`when: data`). One line each, with what it settles. This list is what lets every later task load the right documents without asking anyone; tell the user which were found and that they can add their own.
- `areas` (`forge/packs/core/rules/areas.md`): fill from the scan — **no extra question** when the project already has a map of its parts with commands that read it (write `decision: mapped` and the commands found). Otherwise leave the block out here and settle it in step 4b. `commands.test` stays the whole suite and `areas.test` is one area: write both. A command the manifest declares but whose script is missing is left out, with a line in `notes:`.
- Q1 C ⇒ `angular`; Q2 C ⇒ `java`; Q4 ≠ off ⇒ `visual-qa`.
- Never invent pack ids that do not exist as directories under `forge/packs/`.
- If user asked for a pack that is not present yet, put a note in `notes:` and enable only existing packs.
- Do **not** ask about product panel/lenses — they auto-detect per task (`forge/packs/core/rules/product-lenses.md`).

### 4. The project's documents — consolidate, then write the vision

What describes the product belongs to the project and lives outside `forge/`: the vision (`docs/vision.md`), the map of features and workflows (`docs/features.md`) and the UI canon (`docs/ui-canon.md`). Rule and reasons: `forge/packs/core/rules/product-docs.md`. Every later plan and every sweep reads the vision, so this step is worth ten minutes. Skip it only when the human says `no vision`, or when `docs/vision.md` exists with `status: confirmed` and nothing sits in an old place (then show the paths and ask nothing).

Run this step on a first install **and after every upgrade of Forge**: it is what brings an older project to the current layout.

1. **Move what an older Forge left in `forge/`** (rule § 0.1): `git mv` the feature map, the UI canon and the sweep ledger to `docs/`, fix the paths written inside them, and tell the human what moved. No question: nothing is lost and history follows.
2. **Take stock of the project's own documentation, wherever it is** (rule § 0.2): the README, `docs/`, `doc/`, a wiki folder, ADRs, a design document, a tokens file, the harness instruction files. A short table: document, what it covers, and whether it is current, stale or contradicted by the code. Other projects document themselves differently: find what is there before deciding where anything goes.
3. **Propose the consolidation** (rule § 0.3 and § 0.4), through the host's question tool: for each document `cite` (it stays, the vision points to it — the default), `absorb` (its content moves into the vision or the map) or `leave`. One question per document that would be absorbed, moved or removed, and one per contradiction between two documents or between a document and the code. Never move, merge, rewrite or delete a document of the project without that answer.
   A project that already keeps its vision, its feature list or its design rules in its own place keeps them there: record the path under `docs` in `forge/project.md` instead of creating a second file.
4. **Draft the vision from what exists**, in the language the project's people work in (the language of its existing documents, else the one the human writes in; ask only when the two differ). Record it as `docs.language` in `forge/project.md`. Fill the template `forge/packs/core/templates/vision.md`: every line you can support from the repository, with its source; cite the project's documents instead of copying them. Leave a line empty when nothing supports it: never invent a vision.
5. **Ask what the repository cannot say**, in at most two rounds of four questions, each with your best reading as the first option:
   - what the product is and for whom, when the README does not say it in two sentences;
   - where it is going, and what it will deliberately not be;
   - what wins when choices conflict (speed on a phone, simplicity for volunteers, data safety…);
   - the UI and UX feel, when no design document exists;
   - any architectural rule that must never be broken.
6. **Show the result and get it confirmed**: the paths, then one question, `Confirm` · `I will edit it myself` · `Rework a section`. On `Confirm`, set `status: confirmed <date>` and add the first line of *History*. Otherwise leave `status: draft — unconfirmed`: it is still used, and said to be a draft.
7. A project with no code yet: the vision is written from the human's answers alone, and that is its best use.

The features section of the vision holds **broad lines only**. The workflows as they exist are the map, `docs/features.md`: write it now when the project's documents already describe them, otherwise the first sweep builds it.

### 4b. Areas — look once, after the vision (`forge/packs/core/rules/areas.md`)

- **The project already has areas** (step 3 found the map): nothing to ask.
- **A project with no code yet, or a handful of files:** propose the areas from its journeys — a short list, one line each — as one question (`Use these` · `Change them` · `No areas for now`). On yes, write `areas.decision: mapped` and note in `epics/_next-task-prompt.md` that the first task creates the map, the import rule and the per-area test command with the first area.
- **An existing project:** read the signs of § 4 of that rule from the scan (how long the tests take when a recent run is on record, the largest source files, one route table or several, a per-part test command). Two signs or more → one question with the numbers: `Plan the cut` (→ `/forge-plan` with `forge/packs/core/rules/areas-split.md`) · `Later` · `No`. Write the answer in `areas.decision`. Fewer than two → say nothing and write nothing. A sign you cannot measure (no test run on record, nobody to say how many people work here) is **not met**: never count a guess.

Never start a cut here.

### 5. Optional epics bootstrap (ask once)

If `epics/memory.md` is missing, ask the one conditional question:

7. Create empty epics handoff stubs?  
   A) Yes — `epics/memory.md` + `epics/_next-task-prompt.md` from templates  
   B) No — I will create later via `/forge`

On **7A**, copy:
- `forge/packs/core/templates/memory-epics.md` → `epics/memory.md`
- `forge/packs/core/templates/next-task-prompt.md` → `epics/_next-task-prompt.md` (fill pointer with “none yet — run /forge”)

Do **not** invent features/tasks here.

### 6. Confirm and stop

Show the written paths (`forge/project.md`, `docs/vision.md`, and what was moved or cited) + YAML summary. Tell the user next command is usually `/forge` for a first task. Stop.

## Anti-goals

- Do not start coding.
- Do not create feature/task trees unless the user chose epics stubs (Q7 A) or explicitly asked.
- Do not push.
- Do not load stack pack bodies beyond confirming folder existence.
- Do not spawn subagents for init — keep it on main.
