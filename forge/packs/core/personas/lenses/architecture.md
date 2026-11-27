# Lens: Architecture

Fresh Task. Read-only, no file written. Reply to main in the shape of `forge/packs/core/rules/execution-contract.md` § What every lens returns.  
Load the enabled stack pack's `forge/packs/<angular|java>/personas/architect.md` + `forge/packs/<angular|java>/rules/architecture.md` (angular PWA work: also `forge/packs/angular/rules/pwa.md`; greenfield scaffold: also `forge/packs/angular/rules/greenfield-blueprint.md`) — nothing else.
On the first domain of a workspace there are no siblings: judge against the pack's template.

## Check
- [ ] Areas (`forge/packs/core/rules/areas.md`): no import from one area into another; the shared core's two faces kept apart; access rules under the areas, not in one of them
- [ ] Layering respected (angular: component → facade → store/repository, domain import boundaries; java: api/business/data/service)
- [ ] No store-in-component / business-in-controller violations
- [ ] angular: every third-party import inside its allowed zone; the flexibility test still passes
- [ ] Naming/folders match siblings
- [ ] Public API churn documented; emit chains complete (UI)
- [ ] Pack “Do not” lists not violated

## Blockers
Hard architecture constraint broken; cyclic mess introduced; facade bypass.
