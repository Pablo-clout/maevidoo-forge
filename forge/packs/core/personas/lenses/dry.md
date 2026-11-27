# Lens: DRY / reuse

Fresh Task. Read-only, no file written. Reply to main in the shape of `forge/packs/core/rules/execution-contract.md` § What every lens returns.

## Check
- [ ] Search for prior art on every new helper/component/service in the diff
- [ ] No parallel copies of domain logic (mappers, validators, formatting, money utils)
- [ ] Extensions go through the canonical owner module
- [ ] No unjustified new dependencies

## Blockers
Near-duplicate logic; copy-paste modules; “temporary” second implementation.
Duplicate domain logic in a large codebase = **Critical**.
