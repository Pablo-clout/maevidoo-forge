# Pack: angular

Angular architecture and coding standards. **Reference house style:** components consume facades, one domain template, one door per third-party technology, signals for state (`@ngrx/signals` behind the store boundary), installable PWA. No employer-specific design systems.

**If the consuming repo is built differently** (another state library, another folder layout), keep the **rules** (facades, one door per technology, import boundaries) and map names to what the repo has — never restructure or migrate state libraries as a side effect of a task (`rules/architecture.md` § 0).

Enable via `project.md` → `packs.enabled: [core, angular]`.

## Contents

| Path | When to load |
|------|----------------|
| `personas/architect.md` | hop-2 preflight — domains, stores, facades, routing, wrappers |
| `rules/architecture.md` | normative: facades, one door per technology, domain template, state shapes, persistence, review checklist |
| `rules/pwa.md` | service worker, caching, offline, app update, persisted state |
| `rules/greenfield-blueprint.md` | **greenfield only** — new app/workspace scaffold: reference tree, domain template, ESLint rules to set up. Never load on an existing repo |
| `rules/coding-standard.md` | any `.ts` / `.html` / `.scss` in app |
| `templates/eslint.architecture.config.mjs` | greenfield scaffold — the ESLint rules that enforce the architecture, to copy and adapt |
| `rules/library-first.md` | non-trivial change — search before adding helpers/deps |

## Third-party

External component libraries (PrimeNG, Angular Material, …) → `forge/project.md` `notes:` + local docs — not in this pack.
