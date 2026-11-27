# Greenfield blueprint (Angular workspace)

**Load ONLY on greenfield signals:** new app/workspace, `ng new`, empty `src/`, task says "bootstrap / scaffold / nouveau projet".  
**Existing repo → do NOT load this file.** Apply `architecture.md` § Adaptation instead: keep the repo's structure, apply the principles.  
This is the reference implementation of `architecture.md` — same principles, made literal.

**Philosophy — remove cognitive load for everyone.** The same predictable shape serves juniors (copy the pattern, no architecture debate), experts (zero bikeshedding, review by diff against the pattern), and agents (cannot invent a parallel structure). Small files are the price; predictability is the product. Do not "optimize" this trade-off away.

## Target stack

- Angular standalone components; `OnPush` change detection everywhere (written explicitly unless the workspace's Angular version makes it the default)
- Signals (`input()`, `output()`, `computed()`; `effect()` only justified — see `coding-standard.md`)
- Signal-based stores (`@ngrx/signals` today) confined to `store/` and `libs/shared-state/core/`, behind **facades**
- Component framework confined to **one** lib (`ui-wrapper`) — never imported elsewhere
- Styles driven by tokens (`libs/styles`); the utility layer stays theme-agnostic
- Installable PWA, exposed through facades like any other domain (`pwa.md`) — added when the product needs it
- Test-first: mock facade → red spec → minimal implementation; Playwright for journeys

`architecture.md` is normative — this file makes it literal for a new workspace.

```text
 app (shell + features)  ──►  libs/shared-state   ──►  (HTTP / API, through <domain>/data/)
        │
        └──────────────►  libs/ui-wrapper        (component framework, single importer)
        └──────────────►  libs/styles            (tokens)
```

## Decisions to put to the human at bootstrap

Ask them (`forge/packs/core/rules/asking.md`) before scaffolding and record the answers in `forge/project.md` `notes:` — each one is a dependency or a convention every later task inherits:

1. **Component framework** — which one, or none yet (wrappers over native elements).
2. **i18n mechanism** — which one, or none yet (literals tolerated until chosen).
3. **PWA now or later** — and, if now, offline read only or offline write too.
4. **Backend contract** — generated DTOs from an API description, or hand-written for now.

## Approved dependencies

Following this pack approves: Angular and what its CLI generates (including the unit-test runner), `@ngrx/signals`, the ESLint stack (`angular-eslint`, `typescript-eslint`), Playwright, and — once a second shared domain exists — one cycle checker. Anything else needs the task's DoD or the human (`library-first.md`). Install scripts npm asks you to approve are left to the human.

## Non-negotiables

1. **Components consume facades**, never stores; presentational components only receive `input()` / emit `output()`.
2. **One door per technology** (`architecture.md` § 2).
3. **One domain template**, identical to the folder and file, copied from the reference domain.
4. **Entry points** — `@app/ui-wrapper`, `@app/shared-state/core` (contracts), `@app/shared-state/core/store` (store features, stores only), and one alias per shared domain `@app/shared-state/<domain>`; never a deep import or a relative path into `libs/`.
5. **DTO ≠ model** — DTOs stay in `<domain>/data/`; views receive models or view-models only.
6. **Minimal diffs** — no domain created “just in case”.
7. **Architecture is machine-checked** before the first feature: start from `forge/packs/angular/templates/eslint.architecture.config.mjs`. Rules > review prose.

## Reference tree

Entries marked `+` are created at bootstrap; the others appear with the first task that needs them.

```text
<project>-frontend/
├── src/
│   ├── app/
│ + │   ├── app-shell.*                   # root layout, router outlet (later: update/offline indicators)
│ + │   ├── app.config.ts                 # root providers
│ + │   ├── app.routes.ts                 # lazy routes; each provides its domains
│   │   ├── core/                         # app-level concerns — no domain state, no business rule
│   │   │   ├── auth/                     #   route guard, interceptor, user context
│   │   │   └── error-handling/           #   global ErrorHandler
│ + │   ├── showcase/                     # dev-only route: each wrapper in its variants
│ + │   └── <feature>/                    # 1 folder = 1 feature = 1 route
│   │       ├── <feature>-container.*     # connects views to facade(s)
│   │       ├── <sub-view>/               # presentational: input()/output() only
│   │       └── state/<domain>/           # single-feature domain — same template as below
│   ├── environments/
│   ├── i18n/                             # once a mechanism is chosen
│   ├── manifest.webmanifest              # PWA
│ + └── styles.css                        # global entry: imports the tokens from libs/styles
├── libs/
│ + ├── shared-state/
│ + │   ├── README.md                     # names the reference domain
│ + │   ├── core/                         # contracts: error model, request status type, latest-wins helper
│ + │   │   └── store/                    #   store features bound to the state library (own entry point)
│   │   ├── pwa/                          # a domain like the others (pwa.md)
│ + │   └── <domain>/                     # ── DOMAIN TEMPLATE (below); the first one is the reference ──
│ + ├── ui-wrapper/                       # SOLE importer of the component framework
│ + └── styles/                           # tokens
├── e2e/                                  # Playwright, with the first user journey
├── ngsw-config.json                      # PWA cache strategy
│ + eslint.config.mjs                     # architecture rules
└── pom.xml                               # only when a Maven monorepo drives the npm build
```

**File and class names:** domain files use the role suffixes of the template (`.facade.ts`, `.store.ts`, …). Components follow what the workspace's Angular CLI generates (recent versions drop the `.component` suffix: `search-container.ts`, class `SearchContainer`) — do not fight the CLI's schematics.

## What the CLI does not do for you

The three libraries are **plain source folders reached through path aliases** — not `ng generate library` projects (no ng-packagr, no `projects/`). That needs four manual steps, each a known trap:

1. **Aliases** go in the root tsconfig `paths` (create a base file only if the workspace already uses one).
2. **Type-checking:** the app and spec tsconfig `include` must cover `libs/**`.
3. **Lint:** the lint target's file patterns must cover `libs/**`.
4. **Unit tests:** the test builder's `include` is relative to the app's source root — specs under `libs/` are **silently skipped while the run stays green**. Add `../libs/**/*.spec.ts`, then check the number of spec files in the run matches the number on disk.

`ng add angular-eslint` generates a CommonJS `eslint.config.js`; replace it with the ESM template below.

## Domain template

```text
<domain>/
├── facade/
│   ├── <domain>.facade.ts            # contract: abstract class = type + injection token
│   └── <domain>.facade.impl.ts       # coordination (async–await; no rxjs, no @ngrx)
├── store/
│   └── <domain>.store.ts             # reactive state; the only place the state library appears
├── data/
│   ├── <domain>.repository.ts        # returns Promise<Model>, accepts AbortSignal; HTTP + RxJS stay here
│   ├── <domain>.mapper.ts            # DTO → model, transport error → project error
│   └── <domain>.dto.ts
├── model/
│   ├── <domain>.model.ts             # pure types — no Angular, no library
│   └── <domain>.validators.ts
├── testing/
│   └── <domain>.facade.mock.ts       # plain signals, deterministic (no Math.random)
├── <domain>.providers.ts             # provide<Domain>Domain() / provide<Domain>DomainMock(overrides?) + lifetime comment
└── index.ts                          # only public surface: facade contract, models, providers
```

**Flow:** `container → facade → repository → mapper → store → signals → container`.

The folders and files are mandatory even for a tiny domain; what goes in them is only what a screen uses. No backend yet → the repository returns in-memory data **behind the same contract** (Promise, AbortSignal, DTO → model), so the real one is a drop-in.

**Facade contract and its wiring** (illustrative):

```ts
export abstract class SearchFacade {
  abstract readonly results: Signal<readonly Result[]>;
  abstract readonly loading: Signal<boolean>;
  abstract readonly error: Signal<AppError | null>;
  abstract search(filters: SearchFilters): void;
  abstract reset(): void;
}

// lifetime: route — created on first entry; released on leave only if app.config enables route-injector cleanup
export function provideSearchDomain(): Provider[] {
  return [SearchStore, SearchRepository, { provide: SearchFacade, useClass: SearchFacadeImpl }];
}
export function provideSearchDomainMock(overrides: Partial<SearchMockState> = {}): Provider[] {
  return [{ provide: SearchFacade, useFactory: () => new SearchFacadeMock(overrides) }];
}
```

```ts
export class SearchContainer {
  protected readonly facade = inject(SearchFacade);   // the contract — never the Impl, never the store
}
```

## ESLint architecture rules

Copy `forge/packs/angular/templates/eslint.architecture.config.mjs` to `eslint.config.mjs` and adapt the marked places (component-framework package, alias names). It encodes the doors of `architecture.md` § 2 (imports **and** browser globals: storage, `fetch`, service worker) and the boundaries of § 3, every message stating the fix. It was proven on a real workspace, one deliberately wrong import per rule.

- **Flat-config trap:** a later config block *replaces* the options of `no-restricted-imports` instead of merging them. One block per rule silently drops rules. The template therefore defines **disjoint zones**, each carrying its complete list — keep that structure when you add a rule.
- **Prove each rule once:** feed a deliberately wrong import to `eslint --stdin --stdin-filename <path-in-the-zone>` and see the expected message — nothing is written to the repo. Record the proof runs in the task notes.
- **Wrapper tests:** ship a small test harness with `libs/ui-wrapper` (set a field's value, press a button) so feature tests never reach into a wrapper's DOM — otherwise swapping the component framework breaks every feature spec.
- Not covered by lint, so checked in review: dynamic `import()`, `window.localStorage`-style access, raw native controls beside an existing wrapper, style literals instead of tokens (until a stylelint rule is adopted), cross-domain cycles (until the cycle checker is added).

## Brick roles

| Zone | Responsibility | Never contains |
|------|----------------|----------------|
| `app-shell` | Root layout, router outlet, PWA indicators | Business logic |
| `app.config.ts` | Root providers | Components |
| `src/app/core/` | App-level concerns (auth, errors) | Domain state or business rules |
| `<feature>/*-container` | Connects views to facades, routing | Component-framework tags, store injection |
| `<feature>/<sub-view>/` | Presentational: `input()`/`output()` | Any injection of state or data |
| `libs/ui-wrapper` | Wrappers in the project's vocabulary | State, HTTP |
| `libs/shared-state` | Shared and cross-cutting domains | UI components |
| `libs/styles` | Tokens | Components |

## Recipes

**New screen:** container → presentational sub-views → lazy route (providing its domains) → strings through the i18n mechanism if one is chosen.  
**New domain:** copy the reference domain → rename → decide location (feature `state/` vs `shared-state`) and lifetime → add its alias if shared → register `provide<Domain>Domain()` → container injects the facade contract.  
**New wrapper:** add it in `libs/ui-wrapper` with tests and a showcase entry → export it → consume via `@app/ui-wrapper`.  
**Promote a domain** (second feature needs it): move the folder to `libs/shared-state/`, add its alias, update imports — no rewrite.

**Scale note:** past ~10 shared domains, split `shared-state` into one lib per domain; the template does not change. That split is its own gated task.

## Anti-patterns (reject in review)

- A component that injects a store, a repository or the HTTP client
- A facade contract exposing a state-library type or an `Observable`
- The component framework imported outside `ui-wrapper`
- A raw DTO passed to a view
- `loading` and `error` kept as independent flags (impossible states) instead of one status
- A root barrel re-exporting every domain
- A domain created “in anticipation”, or a single-feature domain parked in `shared-state` (the reference domain excepted)
- A green test run that does not include the specs under `libs/`
- A feature spec that queries the DOM inside a wrapper
- A lifetime comment the router configuration does not make true
- Empty `catch` / silent error handling
