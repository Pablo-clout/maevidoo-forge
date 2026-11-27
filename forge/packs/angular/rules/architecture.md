# Frontend architecture (Angular)

Apply when creating or changing domains, stores, facades, routing or UI structure.  
Goal: a frontend that is **modular, typed, testable, loosely coupled and cheap to read** — every domain looks the same, and every third-party technology can be replaced by touching one place.

## 0. Adaptation (read first)

**Greenfield** (new app/workspace, scaffold task): load `greenfield-blueprint.md` and apply this file literally.  
**Brownfield:** keep the repo's existing structure and state library; apply the *rules* below (facades, one door per technology, import boundaries) and map names to what the repo already has. Restructuring toward this reference, or changing the state library, is its own gated task — never a side effect.

**Areas.** A *domain* here is the technical unit (facade, store, repository). An **area** is the part of the product a user journey lives in, and may hold several domains: `forge/packs/core/rules/areas.md` says how a project is cut into areas, how the border is held and how an area's tests enter it. The two do not compete: domains are how the inside of an area is built.

## 1. The shape

```text
component ──reads signals, triggers intentions──▶ facade ──▶ store        (reactive state)
                                                         └─▶ repository   (data access)
```

- **Presentational components**: `input()` in, `output()` out. No injection of state or data.
- **Containers**: connect a view to **facades**. A container never injects a store, never calls HTTP, never combines network status with business state itself.
- **Facade**: the public contract of a domain. **Store**: owns the mutable state, exposes it read-only. **Repository**: talks to the backend, returns project models.

## 2. One door per technology (hard)

Angular is the assumed base. Every other technology is an implementation detail confined to one place; the rest of the code sees only Angular or project types.

| Technology | Only place allowed | What the rest of the code sees |
|------------|--------------------|--------------------------------|
| Component framework (per project choice) | `libs/ui-wrapper` | the project's wrappers |
| State library (`@ngrx/signals` today) | `<domain>/store/` and the store features of core (`@app/shared-state/core/store`) | read-only Angular `Signal<T>` through the facade |
| HTTP client **and RxJS** | `<domain>/data/` — plus `src/app/core/` and `app.config.ts` for app-level HTTP setup (interceptors, guards, `provideHttpClient`) | `Promise<Model>` of project models |
| Angular service worker | the `pwa` domain's `data/` folder | PWA facades |
| Browser storage | `libs/shared-state/core/` (adapter) | the `StatePersistence` contract |
| Style values | `libs/styles` | tokens |

Consequences:

- A wrapper exposes an API in the project's vocabulary (inputs, outputs, variants) — never the underlying framework's.
- A facade contract exposes only `Signal<T>` and intention methods — no type from a state library, no `Observable`.
- A component, container or facade contains no `@ngrx/*` and no `rxjs` import.
- ESLint forbids each import — and each browser global (`localStorage`, `fetch`, …) — outside its zone, and **every message states the fix** (e.g. “A component does not inject a store: inject the domain facade.”).

**Core has two entry points.** `@app/shared-state/core` holds contracts with no state-library import (error model, latest-wins helper, `StatePersistence`) — any domain layer allowed to use core imports this one. `@app/shared-state/core/store` holds the store features bound to the state library — only `store/` folders import it. One entry point for both would let the state library leak into facades and components.

Two folders are called *core*: **`libs/shared-state/core/`** (state contracts and helpers — the one meant in this file unless stated) and **`src/app/core/`** (app-level concerns: auth, error handling).

**Flexibility test (review gate):** replacing the state library must change only `store/` folders and core's store features; replacing the component framework must change only `libs/ui-wrapper`. No feature component, facade or container test is touched. A change that breaks this test is rejected.

### Async without RxJS outside `data/`

- A repository method returns `Promise<Model>` and accepts an `AbortSignal`. Inside `data/` it may use the HTTP client and RxJS freely (`firstValueFrom`, operators).
- The facade implementation coordinates with async–await. “Latest request wins” (a new search cancels the previous one) uses one shared helper in `libs/shared-state/core/` — not ad-hoc code per domain.
- Server streams (SSE, websocket) are converted inside `data/` into a callback or a signal.
- Transport errors are mapped inside `data/` to the project's error model (`libs/shared-state/core/`); a facade exposes that model, never an HTTP error.

## 3. Domain template (identical everywhere)

```text
<domain>/
├── facade/     <domain>.facade.ts        contract (abstract class)
│               <domain>.facade.impl.ts   coordination
├── store/      <domain>.store.ts         reactive state
├── data/       <domain>.repository.ts    data access
│               <domain>.mapper.ts        DTO → model
│               <domain>.dto.ts
├── model/      <domain>.model.ts
│               <domain>.validators.ts
├── testing/    <domain>.facade.mock.ts
├── <domain>.providers.ts                 provide<Domain>Domain()
└── index.ts                              the only public surface
```

- Same sub-folder names and files in every domain, even when a folder holds one file. One level deep; a domain that needs more is split.
- The template fixes the **shape**, not the content: a domain implements only the intentions and state fields a screen uses (no `select` nobody calls).
- No `utils/`, `helpers/` or `common/` folder.
- Tests are co-located (`<domain>.store.spec.ts` beside `<domain>.store.ts`).
- One `provide<Domain>Domain()` wires the domain; the route or app config knows only that function. `provide<Domain>DomainMock(overrides?)` swaps in the mock facade with an optional partial initial state — tests never import the mock class.
- Nobody creates a domain by hand: use the project's generator, or copy the **reference domain** — one real, consumed, fully tested domain that `libs/shared-state/README.md` names as the model. It lives in `shared-state` even while a single feature uses it (the one exception to the table below). This file says why; the reference domain shows how.

### Where a domain lives

| Used by | Location |
|---------|----------|
| One feature only | inside that feature: `src/app/<feature>/state/<domain>/` — same template |
| Two features or more, or cross-cutting | `libs/shared-state/<domain>/` |

Promotion is a move, not a rewrite — that is why the template is the same in both places. Do not put a single-feature domain in `shared-state` “in case”.

### Public surface and lifetime

- Each shared domain has its **own entry point**: `@app/shared-state/<domain>` → that domain's `index.ts`. There is no root barrel re-exporting every domain (it would pull all domains into the first bundle and defeat lazy loading).
- **Lifetime is explicit — and true.** `provide<Domain>Domain()` in a route's providers ⇒ the state is created when the route is first entered. By default the router **keeps** a route's injector after you leave it: the state survives navigation unless the router is configured to destroy unused route injectors (an opt-in router feature on recent Angular — check the installed version). So either enable that cleanup in `app.config.ts`, or have the container call `reset()` when it is destroyed; never write “dropped on leave” in a comment the configuration does not make true. In the app config ⇒ application lifetime; reserved for cross-cutting domains (auth context, PWA, connectivity). Each `<domain>.providers.ts` says in one comment which lifetime it gets and what guarantees it.

### Import boundaries inside a domain (ESLint)

```text
facade/   → store/, data/, model/, shared-state/core
store/    → model/, shared-state/core, shared-state/core/store
data/     → model/, shared-state/core (error model)
model/    → nothing (no domain folder, no Angular, no library)
testing/  → facade/, model/, shared-state/core
<domain>.providers.ts, index.ts → every folder of their own domain
outside   → index.ts only

shared-state/core depends on no domain. Domain layers never import the UI (`@app/ui-wrapper`); wrappers never import the app or its state.
```

### Between domains

- A facade implementation may inject **another domain's facade contract** (through its entry point): read its signals, call its intentions. Never another domain's store, repository or model internals.
- **No cycles.** If A needs B and B needs A, the shared use-case moves to a third, orchestrating domain. Add an automated cycle check (dependency-cruiser or an ESLint boundaries plugin — approved dependencies for this purpose) when the second shared domain appears; with one domain the direction rules are enough.
- A container that needs two domains injects two facades; it does not merge their state — a derived value combining them belongs in a facade.

## 4. State

**Private state, public read.** The store holds the mutable state; consumers get read-only signals and call actions/intentions.

- One **status** per async resource, never separate booleans: `idle | loading | success | error`, the error attached only to `error`. Facades may expose derived `loading()` / `error()` signals for convenience; the store cannot represent “loading and failed at once”.
- Derived values use `computed`. Side effects live in providers or dedicated services, not in components.
- Recurring concerns (request status, persistence) are reusable store features in `libs/shared-state/core/`, built on project contracts so the logic survives a library change.

**Standard state shapes** — pick the one that fits, do not invent a fourth without a reason written in the task notes:

| Shape | State | Typical intentions |
|-------|-------|--------------------|
| **list** | filters, results, status, current selection | `load`, `search`, `select`, `reset` |
| **detail** | entity (or none), status | `load`, `save`, `remove`, `reset` |
| **form** | draft, dirty flag, validation result, submit status | `load`, `save`, `reset` |

**Fixed vocabulary of intentions:** `load`, `search`, `select`, `save`, `remove`, `reset`. The same concept carries the same name in every domain. An intention may take arguments (`search(filters)`, `select(item)`); do not add a verb just to set a value.

## 5. Facade

The contract is an **abstract class** that is both the type and the injection token — one name, one file.

```text
abstract SearchFacade
    filters, results, loading, error, hasResults : Signal<…>   (read-only)
    search(filters), select(item), reset()                     (intentions)

provideSearchDomain()      → SearchFacade = SearchFacadeImpl
provideSearchDomainMock()  → SearchFacade = SearchFacadeMock

container: facade = inject(SearchFacade); view reads facade.results(); user event → facade.search()
```

The component depends on the contract, never on the concrete class. Swapping the implementation for a mock, or one state library for another, changes nothing in the component.

## 6. UI foundation

- `libs/ui-wrapper` is the single importer of the component framework. Feature code consumes wrappers; a missing wrapper is added there in the same change (tests + an entry in the wrapper showcase — a dev-only route that renders each wrapper in its variants), not bypassed.
- **No framework chosen yet:** wrappers wrap native elements, and the rule is the same — a feature template uses the wrapper for any control that has one (a raw `<button>` beside an existing button wrapper is a review finding; lint cannot see it).
- `libs/styles` holds the tokens and the style entry point. No scattered literal colours, spacings or radii in features.
- Modern control flow (`@if` / `@for` with stable `track` / `@switch`); outputs wired at every intermediate level up to the container.
- **i18n**: user-facing strings go through the project's mechanism — which one is a bootstrap decision put to the human; until it is made, literals are tolerated and listed as a deviation. **a11y**: labels, focus order, modal escape, errors associated with their field.

## 7. Backend boundary

The frontend knows the backend only through typed DTOs, ideally generated from the API contract. A repository receives a DTO, a mapper converts it to a model, and **DTOs never leave `data/`** — a view never handles a raw DTO.

App-level HTTP concerns (auth interceptor, route guards, global error handler) live in `src/app/core/`; they hold no domain state and no business rule.

## 8. Persistence and sensitive data

Persistence is **opt-in per domain** and goes through the `StatePersistence` contract in `libs/shared-state/core/` (see `pwa.md`).

- Each persisting domain declares what it persists; only state useful offline (filters, last results, selection) — never status or errors.
- **Never persisted:** credentials and tokens, personal or financial data, and any response the cache strategy marks as never cached. If the HTTP response may not be cached, its content may not be persisted either.
- Keys are namespaced by **user identity and state version**; a different user on the same device never reads another's state. An incompatible version is ignored, not migrated blindly.
- Sign-out purges persisted state and data caches. Browser storage is readable by anyone with access to the device — do not treat it as protected.

## 9. Tests

```text
store      → isolated unit test: actions, derived values, simulated persistence
facade     → unit test with a mocked repository
container  → test with the mock facade; no state-library import
feature    → drives wrappers through their public API (inputs/outputs or a harness shipped by
             libs/ui-wrapper) — never by querying the DOM inside a wrapper
E2E        → Playwright: nominal journey (+ PWA scenarios, see pwa.md)
```

Test-first. Tests depend on contracts only, so the unit-test runner is replaceable too (Karma is deprecated — a new workspace uses the runner the current Angular CLI generates).

## 10. Review checklist

- Does the component inject only facades (or nothing, if presentational)?
- Does the facade contract expose only `Signal<T>` and intentions?
- Is every third-party import inside its allowed zone (§ 2) — no `@ngrx/*`, no `rxjs`, no component framework outside it?
- Does the domain follow the template, live in the right place, and use the fixed vocabulary and a standard state shape?
- One status per resource — no impossible states? Any cross-domain dependency through a facade contract, with no cycle?
- Does anything persisted respect § 8?
- Does the flexibility test (§ 2) still pass?

## Do not

- Inject a store, a repository or the HTTP client into a component or container
- Expose a state-library type or an `Observable` from a facade
- Import the component framework outside `libs/ui-wrapper`
- Deep-import into a domain past its `index.ts`
- Put a single-feature domain in `shared-state`, or create a domain no feature consumes
- Persist sensitive data, or persist without user-scoped, versioned keys
- Duplicate domain logic that a facade already owns
