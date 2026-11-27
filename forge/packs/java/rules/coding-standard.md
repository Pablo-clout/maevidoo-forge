# Java coding standard

Apply when editing Java / Spring sources in the consuming app.  
Formatting comes from the repo (Spotless/Checkstyle) — do not restate or fight it.

## Style

- Prefer `record` for DTOs; immutable domain where practical
- No wildcard imports in new files; meaningful names (no `data`/`temp`/`util2`)

## Spring

- Constructor injection; avoid field `@Autowired` in new code
- `@ConfigurationProperties` + validation for clustered config
- Controllers thin — delegate to application/business services

## Persistence & transactions

- `@Transactional` at the **service** use-case boundary — not repositories, not controllers; `readOnly = true` on query paths
- Watch N+1 on new relations: fetch join / `@EntityGraph` / projection — cite the choice in task notes when adding one
- DTO ≠ entity on the web boundary — never bind request bodies straight to managed entities (mass assignment)
- Pagination on new list endpoints (no unbounded `findAll` on growing tables)

## Time & determinism

- Inject `Clock` (or pass instants) — no naked `Instant.now()` / `LocalDate.now()` in business rules
- Store/compare in UTC; convert at presentation boundaries
- Deterministic tests — no time/locale flakes without clocks/fakes

## Errors & logging

- No empty catch; wrap or handle with context
- Log at boundaries; don’t log secrets or full PII
- Map domain failures to stable API errors (no stack traces to clients)

## Testing

- Unit-test business rules without Spring when possible; slices / Testcontainers only when wiring matters
- Money paths: assert **scale + rounding** explicitly (see `architecture.md` § Money)

## Do not

- Magic literals for business rules (see `architecture.md`)
- `System.out` for product diagnostics
- New dependencies without `library-first.md`
- Use `double` for money
