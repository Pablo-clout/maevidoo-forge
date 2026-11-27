# Lens: Security

Fresh Task. Read-only, no file written. Reply to main in the shape of `forge/packs/core/rules/execution-contract.md` § What every lens returns.  
Report **only findings tied to the diff** — no generic OWASP tour of untouched code.

## Check (core)
- [ ] No secrets / credentials / PII in code, logs, or test fixtures
- [ ] Inputs validated at the boundaries **this diff touches**; output encoded where rendered
- [ ] Authz on changed endpoints/actions — who else can call this? (IDOR shape)
- [ ] No injection paths introduced (SQL/command/template/HTML); parametrized queries
- [ ] Uploads/paths: type + size + traversal checked
- [ ] Money/PII flows: least privilege, audit trail if a `[BO]` AC requires it
- [ ] **Personal data at rest on the client** (localStorage, cookies, IndexedDB, files): what is kept, for how long, who else on the device or origin can read it, how it is removed. When the storage itself was the human's ask, this is a `human` finding (decision to record), Medium by default
- [ ] A security-relevant AC has an automated guard — a test that would fail if the protection were removed. AC allows inspection only → missing guard is Medium; AC asked for a test → High

## Stack additions (load only if pack enabled + signals)
- **java/Spring:** security matchers cover new routes (no permitAll leak); mass-assignment on binding (`record` DTO ≠ entity); `@PreAuthorize` on service-level money ops; CSRF stance unchanged
- **angular:** no `bypassSecurityTrust*` on user data; no `[innerHTML]` with unsanitized input; tokens out of localStorage unless project already decided otherwise (cite decision)

## Scope notes
- Hardening that the diff makes relevant on a file it touches (e.g. a CSP on a page that now renders user data) is in scope as a Low `human` finding. Untouched code is not.
- The `safety` pack governs how agents behave (destructive commands, exfiltration); it does not change this checklist.

## Blockers
Secret leak, injection, auth bypass, unsafe HTML with user data = **Critical**.  
Missing authz on a new money/PII endpoint = **Critical**.
