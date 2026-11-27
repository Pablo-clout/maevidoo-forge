# Denied actions (human / SecOps SSOT)

Auditable policy for the `safety` pack. **Agents should not load this whole file** into context (priming / truncation risk). Enforcement for Claude Code uses `catalog/deny-patterns.yml` + the PreToolUse hook.

Default-branch git protection is assumed to be handled by the organization (rulesets). This document focuses on **data stores**, **exfiltration**, and **secrets**.

## A — Data store / DB

| Deny (default) | Notes |
|----------------|-------|
| Destructive DDL on shared/non-local DB | Dropping or truncating structures |
| Unbounded mass delete | Deletes without a clear, narrow filter |
| Prod/staging shared DB as agent target | Use local/dev or read-only roles |
| Destructive migrate/reset against non-local | e.g. reset commands aimed at shared envs |

**Floor:** agent DB credentials should be **read-only** outside disposable local DBs.

## B — Exfiltration

| Deny (default) | Notes |
|----------------|-------|
| Send repo/private data outside approved perimeter | Unknown hosts, paste sites, personal email |
| Pipe remote scripts into a shell | Classic supply-chain footgun |
| Upload/sync source to non-allowlisted destinations | scp/rsync/cloud buckets not in policy |

Allowlists (org-specific) belong in `project.md` `notes:` or local settings — not in the always-on model prompt.

## C — Secrets & publish

| Deny (default) | Notes |
|----------------|-------|
| Read secrets then republish | Env files, PEM, credential JSON into public channels |
| Commit secrets | Add secret files to git |
| Publish packages without human ask | Registry publish commands |

Org CI secret scanning remains required.

## Exceptions

Only with **explicit human instruction** recorded on the task (who/when/why). Hooks may still block until the human updates local allow rules.

## Related

- Short agent text: `agent-safety.md`
- Machine patterns: `../catalog/deny-patterns.yml`
- Install: `../install.md`
