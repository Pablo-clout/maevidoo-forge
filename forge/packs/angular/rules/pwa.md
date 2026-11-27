# PWA (Angular)

Load when the task touches installability, the service worker, caching, offline behaviour, app updates or persisted state.  
The PWA is **a domain like the others**: same template, same boundaries (`architecture.md`). No component talks to the service worker, to browser storage or to browser install/connectivity APIs directly.

## Where things live

```text
src/manifest.webmanifest          identity, icons, display mode
src/assets/icons/                 install icons
src/app/                          service worker registration in the providers
ngsw-config.json                  cache strategy
libs/shared-state/pwa/
    facade/  store/  model/  testing/
    data/                         the only place that touches the service worker
```

## Facades

```text
abstract AppUpdateFacade      updateAvailable, unrecoverable : Signal<boolean>
                              checkForUpdate(), activateUpdate()
abstract ConnectivityFacade   online : Signal<boolean>
abstract InstallFacade        canInstall : Signal<boolean>;  promptInstall()
abstract SyncFacade           pendingCount : Signal<number>; syncing : Signal<boolean>
                              lastError : Signal<Error | none>;  retry()
```

Each has a mock, so “offline” or “update available” is simulated in a unit test without a real browser.  
A domain facade may read `ConnectivityFacade`; a component never combines network status and business state itself.

## Cache strategy

| Resource | Strategy | Why |
|----------|----------|-----|
| App shell (js, css, html) | prefetch | starts offline |
| i18n translations | prefetch | readable offline |
| Icons, fonts, images | lazy | smaller first load |
| Stable reference data | cache first | fast, rarely changes |
| Volatile business data | network first + timeout | fresh, falls back to cache |
| Sensitive authenticated responses | **never cached** | security |

- Sign-out purges data caches and persisted state.
- Authentication redirects bypass the service worker.
- The server delivers the HTML entry point and the service-worker manifest with no HTTP cache — otherwise updates do not propagate.

## Update cycle

```text
new version detected → pwa/data updates the PWA store → AppUpdateFacade.updateAvailable() is true
→ the shell shows a notification (ui-wrapper) → the user confirms → facade.activateUpdate() → activate, then reload
```

The app **never reloads without an explicit user intention** — a reload destroys input in progress.

## Offline

**Level 1 — offline read, always present:** `component → facade → store hydrated from local storage`.

**Level 2 — offline write, only when the business need is proven** (it requires idempotent backend operations and versioning; enabling it is its own gated task):

```text
component → facade.intention() → optimistic store update → mutation appended to a persisted queue
network back → ordered replay → success: state confirmed
                              → conflict or failure: rollback + error exposed by SyncFacade
```

## State persistence

Persistence is cross-cutting: it lives in `libs/shared-state/core/`, behind a project contract.

```text
contract StatePersistence      read(key, version) → state | none;  write(key, version, state);  purge()
store feature withOfflinePersistence(key)
    on init: StatePersistence.read → hydrate;  on relevant change: StatePersistence.write
```

- The store feature is a thin adapter; the logic is in `StatePersistence`, independent of the state library.
- What may be persisted, key scoping (user + version) and the purge rule: `architecture.md` § 8 — the “never cached” row above applies to persisted state too.
- The “offline”, “syncing” and “update available” indicators are `ui-wrapper` wrappers styled by tokens.

## Tests

```text
PWA facades → unit test with a simulated service worker
E2E (Playwright) → network cut, then offline consultation
                 → version update offered, then activated
                 → (level 2) offline mutation, then replay on reconnection
```

Test-first applies here too: the offline scenario is written **before** the cache strategy that makes it pass.

## Do not

- Touch the service worker, storage or install prompt outside the `pwa` domain's `data/` folder and the `libs/shared-state/core/` adapter
- Reload the app without the user's confirmation
- Cache or persist sensitive authenticated data
- Enable offline write without the backend guarantees it needs
