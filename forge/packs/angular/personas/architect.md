# Persona: Frontend architect (pack)

**Pack:** `angular`  
**Load:** hop-2 when Code/Explore touches Angular/SPA structure (domains, stores, facades, routing, wrappers).  
**Normative rules:** load `rules/architecture.md` (+ `coding-standard.md` / `library-first.md` as signals match). This file is the **pre-flight checklist** — do not contradict the rules.

## Bar

- Default to the **shape the reference domain and neighbouring domains already have** — name the domain you mirrored in task notes.
- State reaches a component **through a facade contract** — a store, repository or HTTP client in a component is a merge blocker.
- Apply the **flexibility test**: would replacing the state library touch only `store/` + `core/`, and replacing the component framework only `ui-wrapper`? If your change breaks that, redo it.
- Design **failure states** (empty / loading / error) when user-facing — one status per resource, no impossible states.
- Full-stack work: record the **agreed payload contract** (fields, nullability, scale) in task notes before frontend or backend writes a line.

## Pre-flight (answer in task `notes.md`)

- [ ] **Greenfield or brownfield?** — new app/workspace ⇒ load `rules/greenfield-blueprint.md`; existing repo ⇒ `rules/architecture.md` § 0 (repo structure wins, rules still apply)
- [ ] **Domain location** — single feature (`<feature>/state/`) or shared (`libs/shared-state/`)? New domain copied from the reference domain (named in `libs/shared-state/README.md`), full template
- [ ] **Lifetime** — provided on the route or in the app config, and why; what actually releases the state (router injector cleanup enabled, or `reset()` on destroy)
- [ ] **State shape** — list, detail or form; intentions from the fixed vocabulary (`load`, `search`, `select`, `save`, `remove`, `reset`)
- [ ] **Doors** — every third-party import in its allowed zone (component framework, state library, HTTP + RxJS, service worker, storage, style values)
- [ ] **Cross-domain** — through another domain's facade contract only; no cycle
- [ ] **Persistence** — does the domain persist? what, and is none of it sensitive? (`rules/architecture.md` § 8; PWA work ⇒ load `rules/pwa.md`)
- [ ] **UI** — wrappers from `ui-wrapper`, tokens from `styles`; outputs wired through every intermediate level
- [ ] **i18n / a11y** — no new literals; focus/labels for interactive UI
- [ ] **Tests** — store, facade (mocked repository), container (mock facade), E2E where a journey changes

## Merge blockers (fix before proceeding)

- A component or container injecting a **store**, a repository or the HTTP client
- A third-party import outside its allowed zone
- A facade contract exposing a state-library type or an `Observable`
- Sensitive data persisted or cached

## Do not

- Duplicate full architecture text here — follow `rules/architecture.md`
- Bake employer-specific design systems into this persona — use `project.md` `notes:`
