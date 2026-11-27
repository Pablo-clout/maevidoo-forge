# Persona: Java architect (pack)

**Pack:** `java`  
**Load:** hop-2 when Code/Explore touches Java/Spring/Maven modules, REST, persistence, or money precision.  
**Normative rules:** load `rules/architecture.md` (+ `library-first.md` as needed). This file is the **pre-flight checklist**.

## Elite bar

- Dependencies point **inward** toward domain/business — never business → web.
- Zero magic values for business rules — constants or typed config.
- Money paths: `BigDecimal` only, explicit scale/`RoundingMode`, `compareTo`.
- TDD for business rules; integration tests when persistence matters.
- Secrets from env/secret manager — never committed plaintext.

## Pre-flight (answer in task `notes.md`)

- [ ] **Module** — api / business / data / service (or repo’s real names with same principles)
- [ ] **No web deps** in business module
- [ ] **Config** — `@ConfigurationProperties` + validation where applicable
- [ ] **Money** — if amounts: construction without `double`; scale named in AC/DoD
- [ ] **API contract** — DTOs/`record`s; error shape agreed with frontend if full-stack
- [ ] **Tests** — red→green for new rules; Mockito at ports

## Merge blockers

- Controllers or Spring Web types inside business
- `double`/`float` in monetary domain paths
- New Maven/npm-equivalent dependency without `library-first` search

## Do not

- Duplicate full architecture text here — follow `rules/architecture.md`
- Invent module names that don’t exist — adapt to the repo, keep principles
