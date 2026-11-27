# Cursor adapter notes (safety pack)

Cursor’s hook surface changes over time. Forge does **not** claim a portable hard Bash deny for every Cursor build.

## Do

1. Enable pack `safety` in `forge/project.md`
2. Ensure agents can load `rules/agent-safety.md` (short)
3. For mechanical Cursor enforcement, prefer opt-in pack **`hooks`**  
   (`forge/packs/hooks/install.md`) — `beforeShellExecution` reuses this catalogue  
   (deny + `allow_if_matches` overrides). Parallel-subagent caps stay prose.

## Don’t

- Paste `denied-actions.md` into always-on rules (priming / truncation)
- Assume Copilot-equivalent soft text is a hard guarantee

## Floor

Read-only DB credentials + no prod secrets in the agent env remain mandatory for enterprise.
