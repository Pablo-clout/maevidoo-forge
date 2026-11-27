# Component anatomy — what a well-made component looks like, part by part

One card per component type, in the order the detail sheets of `run-ui-detail.mjs` use: `field`, `select`, `dropdown`, `choice`, `button`, `icon-button`, `nav-item`, `navigation`, `header`, `card`, `badge`, `table`, `footer`, `dialog`, `message`, plus `empty state` and `page`, which come from the layout sheet. Values come from the canon (`docs/ui-canon.md`) when it sets them, otherwise from the defaults below.

Each card lists:
- **Parts**: what the component is made of, so each part can be checked;
- **Clearance**: the distances to measure on the close-up;
- **States**: the states the close-up must show;
- **Per band**: how it adapts on phone, tablet, desktop and wide screens;
- **Typical failures**: what to look for first.

Principles: `principles.md`.

**Comparison is the method.** On a sheet, every instance of the type sits side by side. An instance that differs from the others (a different radius, padding, height or icon position) is either a deliberate variant named in the canon, or a defect.

---

### field (text input, textarea)
- **Parts:** label · box · value or placeholder · optional leading/trailing icon · help text · error text.
- **Clearance:** text ≥ 12px from the left border; a trailing icon ≥ max(12, radius + 4)px from the right; the label 4–8px above the box; help and error text 4–8px below it.
- **States:** default · hover · focus (one visible ring) · invalid (border **and** message under the field; with focus, still one ring, in the danger colour) · disabled · read-only · longest value.
- **Per band:** full width on phone; capped at about 640px from tablet up; never wider than 720px.
- **Typical failures:** border too faint to see where to type; error shown by colour alone; two rings when invalid and focused; height different from the selects and buttons beside it.

### select (native or styled)
- **Parts:** box · selected value · chevron.
- **Clearance:** the chevron ≥ max(16px, radius + 6px) from the right border, so it clears the rounded corner; the value ≥ 12px from the left; a long value is cut with an ellipsis before it reaches the chevron.
- **States:** default · focus · open (the list aligned with the box, the selected option marked) · disabled · invalid.
- **Per band:** same height, border and radius as the fields; full width on phone.
- **Typical failures:** the native chevron pressed into the corner of a rounded field; a select styled differently from the fields next to it; the browser's default look among styled controls.

### dropdown (custom: button with a menu or a list)
- **Parts:** trigger (label + chevron) · menu panel · items · selected mark.
- **Clearance:** the chevron ≥ max(12px, radius + 4px) from the right edge of the trigger; the label-to-chevron gap ≥ 8px; panel items with ≥ 12px side padding and a height ≥ 36px (44px on touch).
- **States:** closed · open · hover and focus on an item · selected · disabled item.
- **Behaviour (checked in a flow):** opens below the trigger, or above it when there is no room; closes on Escape, an outside click or a choice; focus returns to the trigger; never clipped by a container.
- **Per band:** the panel is never wider than the screen minus the gutters; on phone it may become a bottom sheet.
- **Typical failures:** the chevron against the edge; a panel cut by `overflow: hidden`; a menu that never closes; a panel narrower than its longest item.

### choice (checkbox, radio, switch)
- **Parts:** control · label.
- **Clearance:** label 8px from the control; the whole row is the target (≥ 44px high on touch).
- **States:** off · on · focus · disabled · invalid · mixed.
- **Typical failures:** a tiny native control among large styled ones; a label that cannot be clicked.

### button (and links styled as buttons)
- **Parts:** label · optional icon · box.
- **Clearance:** label ≥ 12–16px from the left and right borders; icon to label 6–8px; the label on **one** line.
- **States:** default · hover (contrast kept) · active · focus · disabled · busy.
- **Per band:** natural width; full width on phone only when a primary action has no room. On the phone, a frequent or final action (Save, Send, Pay) sits in the lower half of the screen or in a bar fixed to the bottom, within reach of the thumb.
- **Typical failures:** two filled primaries in one view; a hover colour that drops the contrast; a label that wraps; heights that differ from the fields beside it.

### icon-button
- **Parts:** icon · box · accessible name (aria-label) · tooltip.
- **Clearance:** icon centred; target ≥ 32px (44px on touch); ≥ 8px between neighbouring icon buttons.
- **States:** default · hover · focus · active or pressed · disabled.
- **Typical failures:** an emoji or text glyph instead of the icon set; no name; targets that touch each other.

### nav-item / navigation
- **Parts:** container · items · current marker · optional brand and actions.
- **Clearance:** items ≥ 12px of side padding; the current marker inside the item's box; 8px or more between items.
- **States:** default · hover · focus · current.
- **Per band:**
  - **Phone:** a top bar with one row that scrolls sideways, the current item scrolled into view, or a menu.
  - **Tablet:** a side navigation if the content keeps ≥ 520px beside it, otherwise the phone pattern.
  - **Desktop and wide:** a side or top navigation; the content sits **beside it**, never centred far from it.
- **Typical failures:** items breaking onto a second row; a current page shown nowhere; a sidebar squeezing the content on a phone.

### header (page header: title + actions)
- **Parts:** title · optional subtitle · actions.
- **Clearance:** the title starts on the content column's left line; actions are aligned with the content's right line and centred on the title vertically.
- **Per band:** on phone, the actions go below the title, or into a menu if more than two.
- **Typical failures:** actions wrapping under the title on tablet while overflowing on phone; the title not on the content line.

### card (tile, panel, list item in a box)
- **Parts:** box · content (title, value, meta, actions).
- **Clearance:** ≥ 12px inside (16px recommended), equal on all sides, unless the canon says otherwise; ≥ 12px between cards.
- **Consistency:** look-alike cards share padding, radius, border, shadow and height per row.
- **Per band:** the column count follows the width (2 on phone, 2–3 on tablet, 4 on desktop); no label squeezed to one word per line.
- **Typical failures:** a card inside a card inside a panel; one card different from its siblings; text against the border.

### badge (status, count, tag)
- **Parts:** label · box.
- **Clearance:** 6–8px on the sides, 2–4px top and bottom; the label on one line.
- **Typical failures:** status shown by colour alone; badges of different heights on one row.

### table
- **Parts:** header row · rows · cells · row actions · optional selection, sort and pagination.
- **Clearance:** cells with ≥ 8px vertical and ≥ 12px horizontal padding; numbers right-aligned with tabular figures; row actions in their own column, aligned.
- **Per band:**
  - **Phone:** one stacked card per row: the main field as the title, the others as "label: value", the actions at the end.
  - **Tablet:** the 3–4 most useful columns, the rest folded into the main cell.
  - **Desktop and wide:** the full table, with a capped width.
- **Typical failures:** sideways scroll on a phone; cells wrapping onto 3 or more lines; columns cut by a container; a long name clipped with no ellipsis and no way to read it.

### footer
- **Parts:** content (legal, links) · separator.
- **Placement:** at the **bottom of the screen** on a short page, never floating right after the content; aligned with the **content column** (the same left line as the page title); the same on every page.
- **Clearance:** the gutter of the band; a hairline or ≥ 24px of space above it.
- **Typical failures:** floating mid-screen on a short page; spanning under the sidebar while the content starts further right; missing on some pages.

### dialog
- **Parts:** title · body · actions · close.
- **Clearance:** ≥ 24px inside (16px on phone); actions aligned at the end; the dialog never wider than the screen minus the gutters.
- **States:** open · with error · busy.
- **Behaviour:** focus moves into the dialog and back to the opener; Escape closes it.
- **Typical failures:** the browser's default dialog among styled screens; square corners where the canon has radius; a dialog that does not say which item it acts on.

### message (inline feedback, toast, status)
- **Parts:** icon · text · optional action.
- **Placement:** next to where the user acted (under the field, at the top of the form, near the button), or as a toast in one fixed place.
- **Typical failures:** a message far from the action; colour alone; a message that disappears before it can be read.

### empty state
- **Parts:** what goes here (one sentence) · the action that fills it (a button or a link to the screen where it starts).
- **Typical failures:** a raw key or "No data"; no action, so the user hits a dead end; text wrapping one word per line inside a narrow box.

### page (the layout sheet)
- **Lines:**
  - one content column per band: the page title, the content and the footer share its left line;
  - the header and the navigation frame it;
  - the first screen holds the page's main action.
- **Per band:** phone < 600 · tablet 600–1023 · desktop 1024–1439 · wide ≥ 1440, as in the cards above.
- **Typical failures:**
  - a desktop layout squeezed onto the phone;
  - the phone layout stretched onto a tablet;
  - content centred far from the navigation on a wide screen;
  - a footer floating on a short page.
