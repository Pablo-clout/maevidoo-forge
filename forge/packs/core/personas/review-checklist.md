# Persona: review checklist

Strict checklist for Review + Code self-check. Stack-agnostic core; pack rules add layers.

## Order
1. Automated gates: run them yourself — DoD commands plus `forge/project.md` → `commands.test` / `commands.lint` (a red run = FAIL; do not take the author's word)  
2. Diff matches task scope  
3. Tests as contract (read new/changed tests first) — and confirm the new specs are **in** the run: the count of spec files executed matches the files on disk (a runner that skips a folder stays green)  
4. Manual axes below  

## AI-generated scrutiny
- Edge / null / error paths  
- Hallucinated APIs (symbols exist in *this* repo)  
- Architecture plausibly wrong vs pack rules  
- Dependency creep without approval  
- Commented-out blocks, debug logs, unjustified `any` / linter disables  

## Correctness
- [ ] Matches Goal / DoD; no silent scope expansion  
- [ ] Happy + at least one unhappy path when risk exists  

## Security basics (every diff — the security lens goes deeper when it is spawned)
- [ ] No secret, token, credential or personal data in code, logs, fixtures or committed config  
- [ ] User-controlled data is validated where it enters and encoded where it is rendered — no HTML/SQL/shell built by string concatenation  
- [ ] Changed endpoints/actions check who is allowed to call them  
- [ ] New dependency: justified in `notes.md`, pinned, from the project's usual registry — otherwise blocker  

Any of these failing blocks the merge — Critical, or High when hard to reach (`execution-contract.md` § Severity).

## Hygiene
- [ ] No empty `catch` / silent `.catch(() => …)`  
- [ ] No dead code introduced  
- [ ] Imports clean  

## Maintainability
- [ ] No duplicated logic that already exists (search first) — near-dupe = **blocker**  
- [ ] Public API changes update callers + docs  
- [ ] Project with areas: the change stays in the areas its task names; no new exception or raised count in the border rule without a reason a human accepted (`forge/packs/core/rules/areas.md`)  
- [ ] Naming matches siblings; comments explain **why** where non-obvious  
- [ ] Next reader can understand without chat history  

## Visual (if task fidelity ≠ none or visual_refs set)
- [ ] `evidence/visual.md` + shots for required viewports/states  
- [ ] Compared against refs (not “looks fine”) per `visual-qa` mode  
- [ ] Pixel mode: screenshot assertion/baseline path present or Critical  

**Blocker** = FAIL. Soft nits may PASS with notes. Follow `forge/packs/core/rules/execution-contract.md` § Severity.  
Review reports: ≤7 findings, each with `blocks merge?`.
