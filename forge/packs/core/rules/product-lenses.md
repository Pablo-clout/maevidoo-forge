# Rule: product lenses

Inject **PO / BO / UX** expertise (plus **Marketing / Psycho** when pack `product-plus` is enabled) **on demand** — never as slash commands, never as a user question.

## Intent

- Keep `/forge` + `/forge-pilot` as the only product loop.
- Avoid Meta-style context loss: **user prompt stays on main**; lenses only shape artefacts.
- Stay Copilot-safe: **small hop-1**, conditional **hop-2** reads, hard budget.

## Complexity class (auto — do not ask)

Classify once from the user request + Orient/Ground. Record `product_class:` in task `notes.md` § Product lenses.

| Class | Signals (any) | Lenses |
|-------|---------------|--------|
| **micro** | debug / typo / pure refactor / single-file bugfix / “quick fix” / `/forge-debug` / no AC change — **and no UI / no visual refs** | **none** |
| **standard** | new/changed behaviour with AC; UI or API slice; feature task shaping; **any visual refs** | **composition** (same worker) |
| **complex** | new user-facing feature/epic **and** (≥3 lens signals **or** ceremony `governed` / human `strict`) | **panel** (parallel short Tasks) then main merges |

Defaults: if unclear between micro/standard → **standard** only when you are writing or verifying AC; else micro.  
**UI + visual refs ⇒ never micro.**  
Never prompt “Want a product panel?”.  
Ceremony override (`strict`) does not by itself force a product panel — use `complex` signals; but it does force governed quality budgets (`forge/packs/core/rules/execution-contract.md`).

## Lens catalogue (paths)

`po`, `bo`, `ux` live under `forge/packs/core/personas/`. `marketing` and `psycho` live under `forge/packs/product-plus/personas/` and are considered **only when pack `product-plus` is enabled** in `forge/project.md`:

| Id | File | Load when (signals) |
|----|------|---------------------|
| `po` | `po.md` | Writing/changing AC, DoR, scope, MVP cut — **default for standard+ plan** |
| `bo` | `bo.md` | Money, balances, exports, history, admin/ops, RBAC, audit, support |
| `ux` | `ux.md` | UI routes/components, forms, empty/load/error states, a11y, i18n |
| `marketing` | `forge/packs/product-plus/personas/marketing.md` | Positioning, launch copy, in-product claims, GTM, trust narrative |
| `psycho` | `forge/packs/product-plus/personas/psycho.md` | Irreversible actions, money anxiety, high-stakes confirm, trust calibration |

## Copilot-safe budget (hard)

| Constraint | Limit |
|------------|-------|
| Product persona files per worker | **≤ 3** |
| Hop-1 reads | **≤ 3** (skill/workflow + task paths — **no** product personas in hop-1) |
| Product personas | **hop 2+ only**, after signals match |
| Panel workers | **≤ 3** parallel Tasks; each loads **1** persona file |
| Always-on frontmatter | **never** list all personas |

If more than 3 lenses match → keep highest priority, skip the rest with reason in load-trace.

**Priority (keep first):** `po` > `ux` > `bo` > `psycho` > `marketing` (last two only with `product-plus`)

## Modes

### Composition (default for **standard**)

Same Plan or Quality worker:

1. Hop-1: task + memory (+ orient/ground if needed) — no personas.
2. Hop-2: `read_file` only matched persona paths (≤3).
3. Apply checklists into artefacts.
4. Emit load-trace.

### Panel (auto for **complex** only)

Main keeps the user prompt. Spawn **≤3** Tasks in parallel (e.g. PO, UX, BO). Each Task:

- Loads **one** persona file
- Returns ≤40 lines to main: findings, proposed AC/artefact deltas, blocking questions — writes no file
- Does **not** debate other agents

Main **merges** into `task.md` / task `notes.md`.  
No chat debate. No Meta digest of the user prompt.

If ceremony is `lite` → **never** panel (composition or skip).

## Where it runs

| Skill | When | What |
|-------|------|------|
| `/forge` | After Align, while writing plan artefacts | micro → skip; standard → composition on main; complex → panel then merge |
| `/forge-pilot` Quality | Layer-3 axes | Load matching lens checklists for AC/UX/BO verification (≤2 extra files) |
| `/forge-debug` | always | **skip** product lenses |
| Code / Review | — | Do **not** load full product personas (AC already in `task.md`) |

## Load-trace (mandatory when any lens considered)

```text
🧩 Product lenses:
  class: standard
  [x] po ← writing AC
  [x] ux ← *.component.ts in scope
  [ ] bo ← no money/ops signal
  mode: composition
```

Skipped lenses need a one-line reason. Missing a **matched** required lens = process bug (fix before Go).

## project.md (optional override only)

```yaml
product_lenses: auto   # default if omitted
# product_lenses: off  # kill-switch for pure infra repos
```

No `product_panel:` key — panel is an **auto mode**, not a setting or a question.

## Never

- Slash commands for product lenses
- Asking the human whether to run lenses
- Loading every lens “just in case”
- Considering `marketing` / `psycho` when pack `product-plus` is not enabled
- Putting persona bodies into Copilot agent YAML `rules:` lists
- Replacing the user prompt with a Meta summary before planning
