# UI principles — the seven questions behind every detail

Every UI defect a reviewer reports breaks one of these. They apply to any app, at any width. A rule of the probe is a **signal** of a principle, not the principle itself: when a defect shows up that no signal catches, the principle still names it, and the finding cites the principle.

Each principle has three parts:
- **the test**: the question to ask of every component and every page;
- **the signals**: what measures it — probe rules (`forge/packs/visual-qa/tools/ui-probe.js`, each finding carries its `principle`) and views of `run-ui-detail.mjs`;
- **the threshold**: the default, unless the canon (`docs/ui-canon.md`) sets its own value.

## 1. Fit — the content fits its box, at every width
- **Test:** does anything overflow, get clipped, wrap where it should not (a label, a button, a column), squeeze to one word per line, or stretch beyond a useful size?
- **Signals:** `page-overflow`, `element-overflow`, `text-clipped`, `clipped-by-container`, `squeezed-text`, `wrapped-label`, `table-on-phone`, `nav-wraps`, `stretched-field`, `stretched-control`. Run them through `run-ui-sweep.mjs --between 80` so the widths between breakpoints are covered.
- **Threshold:**
  - nothing sideways, nothing cut;
  - labels on one line;
  - 45–80 characters per line;
  - fields ≤ 720px and buttons ≤ 480px on desktop.

## 2. Clearance — nothing touches an edge it should not
- **Test:** inside every framed thing (field, select, button, card, badge, dialog), does text or an icon keep its distance from the border and from the rounded corner? On the screen, does content keep a gutter? Between targets, is there room for a finger?
- **Signals:** `tight-padding`, `cramped-chevron`, `edge-hugging`, `small-target`; the close-ups of `run-ui-detail.mjs`. Compare each instance with the others of its type.
- **Threshold:**
  - text ≥ 8px from the sides of its box and ≥ 4px from its top and bottom (a badge: 6px and 2px), and a trailing icon ≥ max(16px, radius + 6px) from it;
  - a screen gutter of 16px on phone and 24px on tablet;
  - targets of 24px everywhere, 44px on touch.

## 3. Alignment — everything sits on a few shared lines
- **Test:** do the header, the content, the footer and the page title start on the same left line? Do labels, fields and buttons of a form share edges? Do controls on one row share a height and a baseline? Does the content sit next to its navigation rather than float away from it?
- **Signals:** `uneven-row`, `misaligned-edge` (a stacked sibling that starts 2 to 24px off the line its siblings share), `footer-placement`, `stranded-content`; the layout sheet of `run-ui-detail.mjs`, whose guide lines show the content column.
- **Threshold:** shared edges within ±2px; the footer aligned with the content column and at the bottom of a short page.

## 4. Rhythm — spacing follows a scale, and the same relation gets the same space
- **Test:** are gaps taken from the scale? Is the same relation (label → field, field → field, section → section) given the same space everywhere? Are related things closer together than unrelated ones?
- **Signals:** `near-duplicate-spacing`, `off-scale-spacing` (measured against **the project's own scale**, given to the probe with `--scale`; no grid is imposed when the project has none), `style-drift`.
- **Threshold:** values on the canon scale (±1px); the gap within a group is smaller than the gap between groups.

## 5. Readability — it can be read without effort
- **Test:** is the text large enough and contrasted enough, are its lines a comfortable length and height, and is it never truncated where its meaning matters?
- **Signals:** `low-contrast`, `low-contrast-border`, `tiny-text`, `long-lines`, `tight-line-height`, and `typography` against the canon.
- **Threshold:**
  - contrast 4.5:1 for text, 3:1 for large text and field borders;
  - body text ≥ 14px (16 on phone recommended), line height 1.4–1.6;
  - 45–80 characters per line.

## 6. Hierarchy and calm — the eye knows where to go, and is not overloaded
- **Test:** is the primary action the most visible thing, with only one per view? Is there one focal point? Does every box, border, shadow and colour say something? Is the first screen within its budget?
- **Signals:** `flat-hierarchy`, `competing-primary` (two filled buttons in one view, outside repeated rows), `crowded-view`, `load` against the canon budget; the § H, § X and § P questions of the rubric.
- **Threshold:** one filled primary action per view; `load` within the canon budget, and never higher than at the last run without a reason.

## 7. Findability and access — the main things can be found and used by everyone
- **Test:** is the start of each core task visible where the user lands? Does every control do something and have a name? Does focus show? Can the user zoom?
- **Signals:** `not-findable` (`--findable`), `dead-control`, `focus-not-visible`, `state-hidden-by-focus`, `unlabelled-control`, `zoom-disabled`; the first-time-user task walk (rubric § U).
- **Threshold:** each core task's start action is visible on the first screen at every width, and never only inside a closed menu. **On the phone, a screen's main action is within reach of the thumb**: in the lower half of the screen, or in a bar fixed to the bottom, for anything the user does often or at the end of a form. A header action at the top is fine for an occasional one. The probe gives the number (`load.primaryAction.fromTop`, in % of the screen height); the reviewer judges it against how often the action is used (canon § Tasks, `frequent`).

## How to use them
1. Run the signals (probe, width sweep, detail sheets).
2. Look at every close-up and the layout sheet, asking the seven tests of each component against its anatomy card (`anatomy.md`).
3. A finding names its principle and its component. Its acceptance line is the principle's threshold, or the canon's value.

Signals are added only when a principle keeps failing in a way the existing ones miss. The principle never changes because of one case.
