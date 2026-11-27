# Pack: visual-qa

Visual verification when the project has a UI. Controlled by `project.md` → `visual_qa: off | optional | required`, **and** by per-task `visual_fidelity` / `visual_refs`.

Normative protocol: `rules/visual-qa.md` (interpretive vs pixel, viewports, evidence, blockers).

> **Note:** The `angular` pack is **Angular-oriented**. Visual-qa itself is stack-agnostic — use it with any UI pack.

## Tools shipped

- `tools/run-ui-probe.mjs` — screenshot + measurements with the system Chrome (no dependency): `node forge/packs/visual-qa/tools/run-ui-probe.mjs --url <url> [--mobile] [--before "<js>"] [--screenshot f.png]`
- `tools/ui-probe.js` — the in-page measurements (overflow, contrast, focus visibility, state hidden by focus, target sizes, spacing)
- `tools/run-ui-sweep.mjs` — the probe across a width matrix and the widths in between, merged into one report
- `tools/run-ui-detail.mjs` — close-up sheets of every component by type, plus a layout sheet
- `tools/run-engine-diff.mjs` — **optional, needs Playwright with WebKit and Firefox installed**: the same probe in Chromium, WebKit and Firefox, reporting only what differs from Chromium. The tools above do not depend on it and stay on the system Chrome
- `tools/run-chaos.mjs` — one hostile, seeded walk over a running screen (triple clicks, hostile values, a dropping network, a rotating phone) and what broke; `--replay` runs a recorded walk again. The blind walks of `/forge-chaos-sweep`
- `tools/run-scenario.mjs` — plays one recorded scenario the way a person would (open, click and fill by visible name, see, check the data), across pages in one browser; exit 0 = passed. The scripts of `/forge-regression` when the project has no end-to-end runner
- Method for a pure UI/UX review: `forge/packs/core/skills/forge-ui-review/SKILL.md`

## Tool priority

1. Forge CDP measurement scripts (`tools/run-ui-probe.mjs`, `tools/run-ui-sweep.mjs`, `tools/run-ui-detail.mjs`, `tools/run-chaos.mjs`) — first choice wherever Chrome is available: the measurements come from here  
2. Harness-native browser (where available; host details in `docs/multi-harness.md`) — optional exploratory complement; findings still go through replay/check  
3. Playwright screenshots / `toHaveScreenshot()` (required for `pixel`)  
4. Manual screenshot paste only when automation blocked (still attach under `evidence/`)

## When fidelity is set / refs exist

- Mockup / HTML / screenshot on the task ⇒ implement **against** it  
- Ceremony ≥ `standard` (`governed` for pixel) — never `lite`  
- Every UI change passes the probe gate (Code); every screen created or changed gets two independent testers from `standard` up — a **flow test** (what it does) and a **UI review** with its **own** screenshots (`evidence/qa/`)  
- Code must run the **capture → Read → compare → fix** loop before self-check  
- Viewports = only those listed on the task  

## Example loop (dogfood)

```text
1. Open visual_refs from task.md
2. Implement UI
3. Capture evidence/desktop-default.png (browser or Playwright)
4. Read the PNG; diff vs ref (hierarchy, spacing, controls)
5. Fix; re-capture if needed
6. Fill evidence/visual.md (vs_ref: pass|fail per state)
7. Self-check → Review → qa-ux lens (re-captures independently)
```

Optional Playwright sketch (adapt to the consuming app):

```ts
// e2e/visual/example.spec.ts — only when visual_fidelity: pixel
test('checkout matches baseline', async ({ page }) => {
  await page.goto('/checkout');
  await expect(page).toHaveScreenshot('checkout.png');
});
```

## When off / none

- Skip visual steps for backend-only tasks  
- Still fix obviously broken layout if you touch UI incidentally  

## Do not

- Require MCP-only tools as the sole gate  
- Block backend-only tasks  
- Pass “looks fine to me” without evidence when a reference exists  
- Force three viewports by default  
- Use `min` ceremony to skip visual gates on UI work
