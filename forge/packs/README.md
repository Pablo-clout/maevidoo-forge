# Pack registry

| Pack id | Path | Status |
|---------|------|--------|
| `core` | `forge/packs/core/` | available |
| `angular` | `forge/packs/angular/` | available |
| `java` | `forge/packs/java/` | available |
| `visual-qa` | `forge/packs/visual-qa/` | available |
| `product-plus` | `forge/packs/product-plus/` | available (opt-in; extra product lenses marketing + psycho) |
| `safety` | `forge/packs/safety/` | available (opt-in; Claude hard deny via install.md) |
| `hooks` | `forge/packs/hooks/` | available (opt-in; Cursor shell deny wrapper — prose remains law) |
| `memory-bridge` | `forge/packs/memory-bridge/` | available (opt-in, yellow; documented export/import contract — MD remains SSOT) |

External packs (your own folder or git repository) are added with `forge-md pack add` and appear here as extra directories carrying a `.forge-source.json`.

`/forge-init` enables only packs whose directories exist. List requested-but-missing packs in `notes:`.
