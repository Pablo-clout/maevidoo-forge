# Skill: /forge-ui-detail

**Purpose:** The eye for detail. It reviews one screen **component by component**, close up, at every width, against seven principles (`principles.md`) and an anatomy card per component type (`anatomy.md`). It finds what a full-page screenshot hides:
- a chevron against a rounded corner;
- a footer floating mid-screen;
- a card with less padding than its siblings;
- a label wrapping in a button;
- content stranded away from its navigation.

It reports findings only; it fixes nothing.

It is the detail step that the other UI skills call, so they do not keep their own lists of special cases:
- `/forge-ui-review`;
- the `qa-ux` lens of `/forge-pilot`;
- the UI reviewers of `/forge-sweep`;
- `/forge-ux-sweep`.

On its own: `/forge-ui-detail <url> [state]`.

**Why it works.** People spot detail by comparison: one select among four whose chevron sits closer to the edge, one card whose text touches its border, a footer that does not line up with the title above it. The tool puts every instance of a component type side by side, enlarged, at every width, and draws the page's alignment lines. The reviewer then compares, with a card that says what each part should look like. No special-case rule is needed: a defect that breaks a principle is visible on the sheets even when no probe rule names it.

## Inputs
- A URL, and optionally a state script (`--before`, as for the probe), a task path, or the screen's block of `docs/ui-canon.md` (widths, patterns, priorities).
- Read: `principles.md` and `anatomy.md` (next to this file); `docs/ui-canon.md` when it exists. Its values replace the defaults of the cards.

## Procedure

### 1. Measure
Run the three tools on the screen, in the state to judge (env `CHROME_PATH` if Chrome is not found):

```bash
node forge/packs/visual-qa/tools/run-ui-detail.mjs --url <url> --out <scratch>/detail [--widths <canon widths>] [--before "<state>"]
node forge/packs/visual-qa/tools/run-ui-sweep.mjs --url <url> --between 80 --stable --json <scratch>/sweep.json [--scale "<the project's spacing scale>"] [--findable "<start actions>"] [--before "<state>"]
```

`run-ui-detail.mjs` writes:
- **`sheets/<type>.png`**: every component of that type, cropped close up (2×), at each width. Wide components show their two ends, with their measured box, radius, padding and font.
- **the layout sheet** (`<out>/sheets/_layout.png`): the page at each width with guide lines: the content column's edges, the header, navigation and footer frames, and the bottom of the first screen.
- **the inventory** (`<out>/detail.json`).

Pass `--scale` whenever the project has a spacing scale (`docs/ui-canon.md` § Scales, or its design or tokens document): spacing is then checked against it mechanically. Without a scale, none is assumed.

`run-ui-sweep.mjs` gives the measured signals at every width and between the widths. Each finding carries its `principle`.

### 2. Look — one sheet at a time
Open `_layout.png` first, then each component sheet. For each sheet:
1. **Read the type's card** in `anatomy.md`: its parts, clearance, states, behaviour per band and typical failures.
2. **Compare the instances.** The one that differs from its siblings (radius, padding, height, icon position, colour) is a deliberate variant named in the canon, or a finding.
3. **Ask the seven tests** of `principles.md` for this type, and check the clearance values on the close-up. A close-up is 2×, so 16px of clearance shows as 32 image pixels.
4. **Across widths:** does the component keep its anatomy in every band, or does it squeeze, stretch, wrap or lose a part?

On the layout sheet, check:
- that the page title, the content and the footer share one left line in each band;
- that the footer sits at the bottom of a short page;
- that the content sits beside the navigation;
- that the first screen shows the page's main action;
- that each band has a layout made for it.

A signal from the sweep is evidence, not a verdict: confirm it on the sheet before reporting it. A defect seen on a sheet that no signal flagged is still a finding: cite the principle.

### 3. Report
At most 15 findings, most severe first. Each finding gives:
- **Fingerprint**: `screen · component type and name · principle` (for example `items · select "Category" · clearance`);
- **Where**: the widths and the state;
- **What is wrong**: in the card's terms (*"the chevron sits 10px from a 12px-radius border; the card asks for max(16, radius + 6) = 18px"*);
- **Evidence**: the sheet and the instance, plus the signal when there is one;
- **Acceptance**: the principle's threshold, or the canon value;
- **Kind**: `defect`, or `polish` when it is about looks with no measurable breach (forge/packs/core/rules/sweep-ledger.md § 2).

Then:
- **Consistency**: per component type, either "all N instances agree" or the outliers;
- **Checked and found correct**: per sheet, one line, so a clean screen is told apart from one nobody looked at.

Severity: `forge/packs/core/rules/execution-contract.md` § Severity, with these adjustments:
- something unusable at a width (cut, overlapping, unreachable) is **High**;
- a clearance or alignment breach repeated across a component type is **Medium**;
- a single instance is **Low**.

When the canon lists priorities, findings under those principles go up one level, and are listed first.

## Anti-goals
- No finding from a full-page screenshot alone. Detail is judged on the close-ups and the layout sheet.
- No new rule per case. A defect cites a principle; a new probe signal is proposed only when a principle keeps failing in a way no signal catches. The proposal goes into the report, with the principle it serves.
- No taste. "Rounder", "another colour" or "more modern" are not findings unless the canon's direction supports them (then they are polish).
- No code edits.
