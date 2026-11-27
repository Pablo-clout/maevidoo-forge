# Pack: product-plus

Two extra product lenses for consumer-facing products. **Optional** — most engineering work does not need them, so they stay out of `core`.

Enable via `project.md` → `packs.enabled: [core, product-plus]`.

| Lens | File | Loads when |
|------|------|------------|
| `marketing` | `personas/marketing.md` | Positioning, launch copy, in-product claims, trust narrative |
| `psycho` | `personas/psycho.md` | Irreversible actions, money anxiety, high-stakes confirmations |

Loading rules, budgets and priority are the same as the core lenses (PO / UX / BO): `forge/packs/core/rules/product-lenses.md`. Without this pack those two lenses are never considered.
