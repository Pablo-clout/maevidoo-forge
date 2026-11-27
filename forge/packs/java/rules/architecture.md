# Java / Spring architecture

Apply for Java sources, Maven modules, Spring configuration, REST, persistence.  
Module names (`*-api`, `*-business`, …) are a **target pattern** — if the repo differs, keep the **principles**.

## I. Zero magic values

- No opaque business/technical literals repeated in logic (rates, caps, path prefixes).
- Numbers/rates: named constants **or** typed config — not `BigDecimal.valueOf(0.08)` from float.
- Enumerable strings → `enum` with stable codes when exposed on APIs.
- Config: `@ConfigurationProperties` + validation; secrets only via env / secret manager.

## II. Module layering

| Module | Role | Must not |
|--------|------|----------|
| **\*-api** | DTOs (`record`), contracts, shared enums | persistence/web framework guts |
| **\*-business** | domain rules, calculators | Spring Web / controllers |
| **\*-data** | entities, repositories, mappings | HTTP API surface |
| **\*-service** | REST, security, app wiring | deep domain rules that belong in business |

**Dependency rule:** arrows point **inward** toward business/domain — never business → service/web.

## III. Money / precision (when domain handles amounts)

- Construct with `new BigDecimal("…")` or `BigDecimal.valueOf(long, int)` — avoid `double` chains.
- Always explicit `scale` + `RoundingMode`; centralize in a small utility (DRY).
- Compare with `compareTo`, not `equals`.
- Do not propagate `double`/`float` on monetary paths; convert once at I/O boundaries with documented rules.
- Align **displayed** scale with frontend AC when full-stack.

## IV. Clean code

- Single source of truth for rounding, date formats, URL prefixes.
- Prefer immutability (`record`, `List.copyOf`, no setters on sensitive models).
- Short methods, early return, names that state the business rule.

## V. TDD

1. **Red** — behaviour + edges (null, scale, rounding).  
2. **Green** — minimal.  
3. **Refactor** — constants/utilities.

**Tools:** JUnit 5 + AssertJ; Mockito at ports. Integration / Testcontainers when persistence is in play.

## VI. API & errors

- Stable error shape for clients; don’t leak stack traces.
- Validate at boundaries; domain rejects invalid states explicitly.
- Full-stack: document JSON field names + nullability in task notes before coding UI.

## Do not

- Put controllers in the business module
- Commit secrets or production credentials
- Add Maven deps without `library-first.md`
- Use `double` for money
