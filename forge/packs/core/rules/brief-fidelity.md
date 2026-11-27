# Rule: brief fidelity

**User-authored brief Markdown in scope ⇒ plan artefacts must not drop sections; compression only with explicit `omitted: …` log in task notes.**

A rich brief is an asset, not noise. `/forge` structures it — it never thins it.

## Trigger

Any `.md` the human attaches, `@`-mentions, or points at as the ask (brainstorm briefs, PRD drafts, spec folders like `_brainstorm/…`) is a **brief**. One line in chat is not a brief; a structured document is.

## Contract (feature.md + task.md)

1. **Brief source** — list the brief path(s): `brief_source:` in task meta, `## Brief source` / meta in feature.
2. **Preserve, at minimum:**
   - **Objective** — faithful quote or dense paraphrase; never an anemic one-liner when the brief says more
   - **Detailed scope** — the brief's bullets (not collapsed to one line)
   - **Out of scope** — carried over verbatim where possible
   - **Skills / harness constraints** the brief (or `forge/project.md`) names — each named skill gets ≥1 AC or DoD line evidencing it was applied, noted in task notes
   - **"Done when"** — mapped into the AC table or DoD (each criterion lands somewhere checkable)
   - **Product/UX refs** — listed; UX docs also go to `visual_refs` (UI FE guard applies)
3. **Density floor** — brief > ~15 useful lines ⇒ `feature.md` ≥ ~30 useful lines. Order of magnitude, not a quota: the test is *could Code work from the artefact alone without reopening chat?* Single-task plan with no `feature.md` ⇒ the same sections and floor apply to `task.md` (Goal / Boundary / Notes).
4. **Structure still wins** — brief content is mapped into Goal/Scope/AC/DoD sections. A blind full-paste with no AC table fails review just like a skeleton does.
5. **Code anchor** — when the app lives in a subfolder (e.g. a `mockup/` prototype), `code_root` is set explicitly in feature meta.
6. **Anything dropped** → task `notes.md`: `omitted: <section> — <reason>`. No silent cuts.

## AC provenance

AC = brief "done when" **+** Align answers — never Align alone when a brief exists. Cite the brief line an AC came from when non-obvious.

## Anti-goals

- Meta-rewrite: replacing the brief with a shorter "improved prompt" (`/forge` § Meta rewrite)
- Copy-pasting the entire brief as the artefact without AC/DoD mapping
- Padding to hit the density floor — density means preserved substance, not filler
