# Frontend coding standard

Apply when editing app TypeScript, templates, or styles (not the Forge framework itself unless the consumer app is Angular).  
Formatting (indent, quotes, semicolons) comes from the repo's formatter/linter — do not restate or fight it.

## TypeScript

- Prefer `inject()` over constructor DI in new code (match siblings if the repo differs)
- Signals for component state; `computed` for derived; `effect` only with a justified write/persistence (one-line why in code)
- Public APIs: explicit types; no `any` — `unknown` + narrow
- Methods ≤ ~30 lines; files ≤ ~400 lines — split when exceeded

## Templates

- Modern control flow: `@if`, `@for` (with stable `track`), `@switch` — no legacy `*ngIf` / `*ngFor` in new code
- No logic-heavy templates — move to class or facade
- Accessibility: labels, focus order, keyboard paths; associate errors with inputs
- i18n keys for user-visible strings when the project uses i18n
- Prefer semantic color/tokens over ad-hoc hex

## Components

- Dumb UI: signal inputs in, outputs out; no HTTP/store injection
- Containers: facade contracts only (see `architecture.md`)
- Standalone components by default when the repo uses them

## Testing

- Unit-test facades and pure functions (success + error)
- Component tests for non-trivial UI behaviour
- Mock facades in component tests — not stores — when architecture uses facades
- E2E/visual when task DoD or `visual_qa` requires it

## Errors

- No empty `catch` / swallowed errors
- User-visible failures need a state (toast/banner/inline) — not console-only

## Docs

- New public export (facade, shared util) ⇒ JSDoc; behaviour change ⇒ nearest README updated (see `architecture.md` § Cross-cutting)

## Do not

- Commit secrets or env credentials
- Add dependencies without `library-first.md`
- Bypass wrappers when they exist for the primitive you need
