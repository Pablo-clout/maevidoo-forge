# project.md schema

Canonical project routing file written by `/forge-init`.

```yaml
# forge/project.md
version: 1
name: string                 # project display name
profiles:
  ceremony_default: auto | lite | standard | governed   # auto (default): the orchestrator picks per task
  worker_tier: strong | fast   # who writes the code. fast (default when unset) = cheaper/faster model ⇒ a review on every behaviour change
  gate: auto | always          # auto (default): /forge goes on by itself after planning unless the task is risky; always: it asks Go every time
  # Optional — default when absent is inherit (omit Task model → same as parent chat).
  # Set only to force a host-specific slug on every Forge spawn; never invent ids.
  # subagent_model: inherit | <host-slug>
packs:
  enabled:                   # list of pack ids under forge/packs/
    - core                   # always implied; may still be listed
    # - angular
    # - java
    # - visual-qa
    # - safety              # short agent policy + optional Claude deny hooks
    # - hooks               # opt-in Cursor hooks.json (mechanical judge; prose remains law)
    # - product-plus        # extra product lenses: marketing, psycho (consumer-facing products)
    # - memory-bridge       # yellow: optional claude-mem/mem0 bridge (MD remains SSOT)
visual_qa: off | optional | required
commands:                    # optional — how agents run this project (detected by /forge-init; edit freely)
  dev: string                # start the app locally, e.g. npm start
  url: string                # where it answers, e.g. http://localhost:4200
  test: string               # unit tests
  lint: string               # linter / type-check, if any
  build: string              # production build, if any
  e2e: string                # end-to-end / visual tests, if any
  reset: string              # put the data back to a known state (used by /forge-sweep before it starts)
knowledge:                   # optional — the project's own documents, and when an author must read them (detected by /forge-init; edit freely)
  - path: string             # e.g. DESIGN.md, docs/conventions.md, docs/api-contract.md, src/styles/tokens.css
    when: ui | data | api | always | <path glob>   # ui = anything visible · data = storage / state · api = endpoints, contracts · a glob such as src/billing/**
    about: string            # one line: what it settles
docs:                        # optional — where this project keeps the documents that describe it (forge/packs/core/rules/product-docs.md). Set a key only when the project keeps that document somewhere else
  language: string           # e.g. fr, en — the language these documents are written in; agents write in it whatever the chat's language
  vision: string             # default docs/vision.md — what the product is; the human's document
  features: string           # default docs/features.md — the map of features and workflows
  ui_canon: string           # default docs/ui-canon.md — scales, patterns, words, screens
  sweep_ledger: string       # default docs/sweep-ledger.md — what the sweeps fixed and guard, and what was decided
areas:                       # optional — the project is cut into areas (forge/packs/core/rules/areas.md). The map itself stays in the project; these are the commands that read it
  decision: mapped | later | declined <date>   # what the human answered when Forge asked; `declined` and `later` keep reviewers quiet
  map: string                # the one file that lists the areas and their folders, e.g. scripts/areas.mjs
  check: string              # every file has an area
  boundary: string           # the import rule and its counted exceptions, e.g. npm run lint
  changed: string            # which areas a change reaches
  test: string               # unit tests of one area, with {area}, e.g. npm run test:area -- {area}
  e2e: string                # browser or end-to-end tests of one area, with {area}
  enter: string              # how a test enters an area by state: the shared helper, e.g. app.phone(role, url)
  shared: [string]           # the shared code every area may import
sweep_data: disposable       # optional — set only when commands.url is a remote test instance whose data may be created and deleted by /forge-sweep
chaos:                       # optional — written by /forge-chaos-sweep after the human answered once, so later runs do not ask again
  testers_model: string      # the model the human chose for the testers, as the host names it. Forge never fills it in by itself
  testers: number            # how many testers per workflow (default 2)
  at_once: number            # how many testers run at the same time (default 5)
  accounts: string           # how each tester gets its own test account, e.g. "chaos01@test.local … chaos15@test.local, password in .env.test"
product_lenses: auto | off   # optional; default auto. Kill-switch only — panel is auto-detected, never asked
notes: string                # freeform (e.g. allowlisted internal APIs)
```

### Allowed top-level keys

`version`, `name`, `profiles`, `packs`, `visual_qa`, `commands`, `knowledge`, `docs`, `areas`, `sweep_data`, `chaos`, `product_lenses`, `notes`.  
Harness: `tests/harness/validate-project-md.py` — missing `version` or invalid `ceremony_default` → **error** (exit 1); unknown top-level keys → **warning** on stderr (exit 0 if no errors).

### Ceremony override (per invocation — not in project.md)

Humans may pass **`min` | `normal` | `strict`** on `/forge`, `/forge-plan` or `/forge-pilot`. `/forge-light` is `min` with a shortened plan.  
Mapped to `lite | standard | governed` via `forge/packs/core/rules/execution-contract.md`.  
One-shot overrides are stored on the task (`ceremony` + `ceremony_override`), not as a project default.

### Ceremony and worker tier

`ceremony_default: auto` (or the key absent) lets the orchestrator choose the level per task from its risk and from `worker_tier`, and raise it when a run shows a problem (`forge/packs/core/rules/execution-contract.md` § Ceremony). Naming a level here forces that level as the default for every task.

`worker_tier` describes the model that writes the code in this project, not the one that plans. Set `strong` only for a top-tier model; leave `fast` (or unset) for cheaper and faster ones — measured, a fast worker needs one fresh review to match a strong one. Change it when you change model.

### Subagent model (`profiles.subagent_model`)

Default when absent: **`inherit`** — spawn Tasks without a `model` parameter so workers use the parent chat model (`execution-contract.md` § Model inheritance).  
Set a host-specific slug only when you intentionally want every Forge worker on a different model than the chat picker. Token-economy plans (e.g. Cursor Grok / Composer pools) usually want inherit.

### Commands

`commands` tells workers how to run the project instead of guessing: Code and Review both run `test` / `lint` / `e2e` (Review re-runs them — it does not trust the author's claim); the **qa-ux** tester uses `dev` + `url` to run the app and capture its own screenshots. Missing keys are allowed — the tester then looks for a start script and, failing that, reports `evidence: author-only`.

### Safety pack

When `safety` is enabled: agents load only `forge/packs/safety/rules/agent-safety.md` (short).  
Hard deny = optional Claude adapters (`forge/packs/safety/install.md`). Default-branch push = org rulesets.

### Hooks pack

When `hooks` is enabled: install Cursor fragment per `forge/packs/hooks/install.md`.  
Claude stays on the safety PreToolUse path — see `forge/packs/hooks/adapters/COMPATIBILITY.md`.

### Memory-bridge pack

When `memory-bridge` is enabled: follow `forge/packs/memory-bridge/rules/memory-bridge.md`.  
No runtime is shipped — yellow enterprise adapter only. Markdown continuity stays mandatory.

Do **not** add `product_panel:` — panel mode is inferred per task by `forge/packs/core/rules/product-lenses.md`.
