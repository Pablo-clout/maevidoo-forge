# Rule: the project's documents — the vision, the map, and what is on neither

Forge is a plugin: the `forge/` folder is installed, replaced on upgrade and can be removed. **What describes the product belongs to the project, not to Forge.** It lives outside `forge/`, it survives an uninstall, and a person who has never heard of Forge can read it.

| | Default place | What it holds | Who writes it |
|---|---------------|---------------|---------------|
| **The vision** | `docs/vision.md` (template `forge/packs/core/templates/vision.md`) | What the product is, for whom, where it is going, its big features, its architecture and technologies, its UI and UX direction. Broad lines. | **The human.** Agents propose, the human accepts (§ 2). |
| **The map** | `docs/features.md` (template `forge/packs/core/templates/features.md`) | The app as it is today, cut into features and workflows: where each starts, what it needs, what it touches. | Agents propose changes; the human accepts or refuses each (§ 3). |
| **The UI canon** | `docs/ui-canon.md` (template `forge/packs/core/templates/ui-canon.md`) | Scales, patterns, words, the screens and their states. | The UX sweep adds; the human settles its Direction. |
| **The sweep ledger** | `docs/sweep-ledger.md` (template `forge/packs/core/templates/sweep-ledger.md`) | What the sweeps already fixed, with the check that guards each fix, and what the human decided. It is what lets a feature keep being tested the same way for as long as it exists. | The sweeps; the human edits any entry, and their edit wins. |
| **Off the map** | nowhere | What exists in the app and is written in none of them. | Every sweep goes looking for it (§ 4). |

**These documents outlive the work that produced them.** `epics/` is where work is planned, done and closed: a task's folder is deleted when it closes, a feature's folder when the feature is done, and only the journal stays. Nothing a sweep needs to keep testing a feature may live there, because the feature goes on being tested long after its epic is closed. So:
- closing a task, a feature or an epic **never deletes, archives or prunes** anything under `docs/`;
- a feature that is finished **stays on the map**, with its workflows, and its guards stay in the ledger. It leaves the map only when the feature itself is removed from the product, and then by a proposal the human accepts (§ 3);
- what belongs to one piece of work stays under `epics/`: the plans, the journal (`epics/decisions.md`), the queue of what shipped since the last sweep (`epics/to-sweep.md`) and the sweep reports.

Forge's own settings for the project stay in `forge/project.md`, the one file of `forge/` that belongs to the project; the installer never overwrites it.

**Other places.** A project that already keeps these documents elsewhere keeps them there: `forge/project.md` → `docs` gives the path of each (`vision`, `features`, `ui_canon`, `sweep_ledger`). Wherever a skill or a rule of Forge writes `docs/vision.md`, `docs/features.md`, `docs/ui-canon.md` or `docs/sweep-ledger.md`, it means the path that block gives, and the default when the block is silent.

**Any language.** These documents are written in the language the project's people work in: French, English, whatever the human chose. `/forge-init` takes it from the documents the project already has and from the language the human writes in, and records it as `docs.language` in `forge/project.md` so that no later agent guesses again. An agent that adds to one of these documents writes in that language, even when the conversation is in another.
- **Translated freely:** all the prose, and the headings (keep their order and their numbers, so that "§ 5" still means the UI and UX direction).
- **Kept as written:** the field names and their fixed values, because agents match on them: `status: confirmed`, `status: proposed`, `core: yes`, the ledger's verdicts (`fixed`, `validated`, `decided`, `deferred`, `declined`, `asked`, `polished`), ids, paths and commands.
- The templates are in English; they are a shape to fill, not text to keep.

**Why a vision and a map.** The vision says what we want; the map says what exists. They drift apart in two different ways, and the answer is not the same: when the app loses a workflow the map follows the app; when the app contradicts the vision, a human must say which of the two is wrong.

## 0. A project that does not have this layout yet — consolidate

Forge arrives in projects that already have their own documentation, organised their own way, and in projects set up by an older Forge. `/forge-init` brings them to this layout, and any skill that finds the layout missing says once: `this project has no docs/vision.md — run /forge-init, it will consolidate what exists`.

1. **Move what an older Forge left in `forge/`**, with `git mv` so history follows: the feature map, the UI canon and the sweep ledger that used to sit beside `forge/project.md` go to `docs/`, under the same file names. Then fix the paths written inside them. This is mechanical: do it, and tell the human what moved. A sweep that finds them still in the old place does this one step itself before it starts, so that it does not begin a second map or a second ledger beside the first.
2. **Take stock of what the project already says about itself**, wherever it is: the README, `docs/`, `doc/`, a wiki folder, ADRs, a design document, a tokens file, the instruction files of the harnesses (`AGENTS.md`, `CLAUDE.md`, rule files), comments at the top of the main modules. For each document: what it covers (product, vision, features, architecture, UI direction, conventions), and its state against the code (current, stale, contradicted).
3. **Propose a consolidation, never impose one.** The project's own documents are the project's: nothing of them is moved, merged, rewritten or deleted without the human. For each document, one of:
   - **cite**: it stays where it is, and the vision points to it for the detail. The default for anything current and well kept;
   - **absorb**: its content moves into the vision or the map, and the original becomes a pointer or is removed. Only where two documents say the same thing, or one is a fragment;
   - **leave**: it has nothing to do with these documents.
   Where two documents contradict each other, or one contradicts the code, say which and ask which is right: that answer is what the vision will say.
4. **Show the plan and ask**, through the host's question tool (`forge/packs/core/rules/asking.md`): the inventory as a short table, then one question per document that would be absorbed, moved or removed, and one per contradiction. `cite` and `leave` need no question.
5. **Write the result**: `docs/vision.md` (drafted from what was found, § the template), `docs/features.md` when the project has enough to map, and in `forge/project.md` the `docs` block when a document is kept elsewhere, plus `knowledge` for the documents cited.
6. Nothing found at all → the vision is written from the human's answers, and the map by the first sweep.

## 1. Reading the vision

- **Every plan reads it first** (`/forge`, `/forge-plan`, `/forge-light`): a task that goes against the vision is stopped at planning, with the question put to the human, never discovered at review.
- **Every sweep reads it** (`/forge-sweep`, `/forge-ux-sweep`, `/forge-chaos-sweep`): it is the yardstick for "is this what the product is meant to do".
- **Missing** → the work goes on without it, and the report or the close says so once (§ 0).
- `status: draft — unconfirmed` → it is used, and said to be a draft.

## 2. When the code and the vision disagree — the vision proposal

Nothing is worse than a vision that has moved while its document did not, or code that has left the vision while nobody noticed. So an agent that sees a disagreement **never edits the vision by itself, and never keeps quiet**.

**When.** At the end of the task or of the sweep, never in the middle: the work is finished first, on the vision as it stands.

**First, say which way it goes.** For each disagreement the agent states what it believes and why:
- **the code drifted**: the vision still says what is wanted, the code went elsewhere by accident. This is a finding against the code, not a change to the vision;
- **the vision moved**: decisions already taken (a task the human asked for, an entry of `epics/decisions.md`) changed what the product is, and the document is behind;
- **cannot tell**: say so. The human decides.

**Then, the proposal.** One entry per change, each with all of this, or it is not proposed:
- the **section** of the vision;
- the **text today**, quoted;
- the **text proposed**, in full;
- what is **removed**, said in so many words, when anything is;
- **why**: the evidence, with its place (a file and line, a screen, a dated entry of the journal, the human's own request);
- what **follows** if accepted (a workflow of the map, a rule of the canon, work to schedule) and what follows if refused (the code is then the thing to fix).
Also list what **does not change**, so the human can see the proposal touches nothing else.

**Show it, then ask.**
1. Write the proposal as data and render it: `node forge/packs/core/tools/vision-proposal.mjs <proposal.json>` gives a page with the before and the after side by side, what is removed struck through, and what stays, in the human's language. With one small change, the text summary the tool prints is enough; with three changes or more, or any removal, give the human the page.
2. Ask through the host's question tool, **one question per change**: `Accept` · `Refuse — keep the vision, the code is what must change` · `Rework` (the human says how). Never one global "accept all" when a removal is among them.
3. A scheduled run has nobody to ask: the proposal goes under *Needs you* in its report, with the page's path, and the vision is left as it is.

**After the answer.**
- **Accepted** → edit `docs/vision.md` exactly as shown, add the line to its *History*, add the dated decision to `epics/decisions.md`, and update what follows (the map, the canon) or list it as work to do.
- **Refused** → nothing changes in the vision. The disagreement becomes a finding or a follow-up against the code, recorded so that it is not proposed again in new words.
- **Rework** → the human's wording, shown back once before it is written.

The human edits the vision whenever they like, without Forge: it is their document.

## 3. The map follows the app — by proposals

`docs/features.md` is cut small enough for a sweep to send a tester to one workflow, and it moves with the app.

- Each feature carries `status: confirmed` or `status: proposed <date> — by <who> — <why>`.
- A sweep or a task that finds a workflow that is not on the map, a workflow that is gone, or one that no longer starts where the map says, **proposes** the change: it writes it as `proposed`, and tells the human what it added, changed or would remove, and why.
  - Interactive run → the question tool, one question per feature touched: `Accept` · `Refuse` · `Rework`.
  - Scheduled run → listed under *Needs you*, and left `proposed`.
- **A proposed workflow is tested like a confirmed one.** Being unconfirmed is no reason to skip it.
- **Nothing is removed from the map without the human**: a workflow that seems gone is marked `proposed: remove`, with what was looked for and not found.
- A change of the map that contradicts the vision (a feature the vision rules out, a big feature it does not mention) is also a vision proposal (§ 2).

## 4. Off the map — every sweep looks beyond its documents

The map is where to go for certain. It is never the limit of where to look.

- **Compare.** At the start of a sweep, main sets the map beside what the app really offers: its navigation, its routes, the links on its home screen. What appears in the app and on no feature of the map is the **off-map list**.
- **Go there.** `/forge-sweep` and `/forge-ux-sweep` walk the off-map list after their fixed part, as they walk a proposed feature. `/forge-chaos-sweep` gives it to one more tester, whose workflow is "what is written nowhere": it starts from the home screen and goes where the map does not lead.
- **Keep looking while testing.** A tester that meets a screen, a menu entry or a behaviour its brief did not mention goes in, within its budget, and reports it.
- **What is found becomes a proposal** for the map (§ 3). A sweep that found nothing off the map says so in one line, so that "nothing" can be told from "did not look".
