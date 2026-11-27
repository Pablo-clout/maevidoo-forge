# Chaos specialties — three ways of looking at one workflow

Read by a tester of `/forge-chaos-sweep`, who reads **its own section only**. Each workflow gets one tester per specialty. They see the same screens and report different things.

## ux — how it feels to use

You judge the experience of doing the task: is it clear, forgiving and honest with the person using it?

**Read first:** in `forge/packs/core/skills/forge-ux-sweep/rubric.md`, the sections **F** (states and feedback), **W** (words), **U** (usability) and **N** (navigation).

**Your tool is misuse.** Fill forms wrong, leave fields empty, submit twice, cancel, go back, change your mind halfway.

**Look hardest at:**
- **feedback**: does every action get a visible answer, near where you were looking? Can you tell success from failure?
- **errors**: does the message say what is wrong and where, next to the field? Is what you typed kept?
- **danger**: can one stray click destroy something? Is it confirmed, or can it be undone? Does the dangerous button look like the safe one?
- **words**: does a button say what it will do? Is the same thing called the same thing on every page and button? Are dates and numbers unambiguous?
- **dead ends and effort**: an empty list that says nothing useful, a step that makes you start again, work you have to redo.

## design — how it is made to look

You judge the screens as made objects: easy to read, orderly, one family, right at every width.

**Read first:** `forge/packs/core/skills/forge-ui-detail/principles.md` and `forge/packs/core/skills/forge-ui-detail/anatomy.md`; in `forge/packs/core/skills/forge-ux-sweep/rubric.md`, the sections **D** (detail), **T** (type), **C** (colour and contrast) and **P** (polish).

**Your tool is your eyes.** Use the workflow carelessly to put each screen in its states (empty, filled, with errors, after an action), take a screenshot of each state at 390, 768 and 1280px, and **open every image**. Less clicking than the others, more looking.

**Look hardest at:**
- **readability**: is any text too pale, too small or too cramped to read without effort? When in doubt, measure the contrast of the text against its background (4.5:1 for normal text) instead of guessing;
- **fit**: does anything overflow, get cut, overlap, or make the page scroll sideways, at any of the three widths?
- **alignment and rhythm**: do fields, labels and cards share their edges? Is the spacing regular? Measure a doubtful edge with the element's box;
- **one family**: do buttons, icons, fields and cards look the same on every screen of the workflow? Compare with **one other page of the app** (its home page or dashboard): a page whose buttons or icons differ from the rest is a finding;
- **hierarchy**: is the main action of each screen obvious, and alone in being loud?

## workflow — does the whole thing hang together

You judge the logic of the task from start to finish, and what it leaves behind in the rest of the app.

**Read first:** in `forge/packs/core/skills/forge-ux-sweep/rubric.md`, the sections **U** (usability) and **N** (navigation).

**Your tool is following things through.** Never stop at the confirmation message.

**Look hardest at:**
- **consequences**: after you create, change or delete something, go and look everywhere it should show: the list, the counters, the totals, the tables, the home page. Does it appear at once, without a reload? Do all the pages agree?
- **claims**: when a message says something else was updated, go and check that it was;
- **order and prerequisites**: what if the thing a step needs does not exist yet (no team, no tournament)? Is there a way to create it from here, or do you have to abandon your work?
- **rules of the real world**: does the app accept what cannot be (a team against itself, a date in the past, the same thing twice, a number that contradicts another)?
- **going off the rails**: back, forward, reload, two tabs, the same step twice. Is anything lost, duplicated or left half done?
- **filters and views**: when you choose a filter, do the numbers really change, and do they match the source?
