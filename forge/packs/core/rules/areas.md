# Rule: areas — a project cut along what its users do

An **area** is a part of the product that a person or an agent can read, change and test without opening the rest: its own folders, its own routes or endpoints, its own tests, resting on shared code that is declared. Front end and back end alike. (French: *zone*. Not to be confused with the technology zones of a stack pack's import lint.)

Why it is a Forge default: an author who has to hold the whole project in mind is slow and breaks things at a distance; one who works inside an area reads less, and a machine holds the borders for it. Measured on one real project (`docs/areas.md`). **Forge proposes and flags; the human decides whether a project is cut.** Never start a split unasked.

## 1. What makes an area

- **Drawn along user journeys**, read from the screens, the routes and the end-to-end tests — not along data tables or technical layers: the data is shared by almost every area.
- **One import rule:** an area imports its own code and the shared code. Never another area. What two areas need moves to the shared code, or the dependency is turned around. The shared code imports no area.
- **The border is held by a machine** (a lint or build rule in the project's own tooling), not by attention. Every exception is written down with its reason and **counted**: one breach more fails, and an exception that excuses nothing any more fails too.
- **The shared core stays small and has two faces:** what an area may use (reads as the person may see them, the access rules, writes that each carry their rule) and the internals (sync, raw reads, machinery). One face only, and every area inherits the right to bypass.
- **Access rules live under the areas, in one place.** Cutting a project creates a new path to the data for each piece: a rule that only lived in the old central module is gone the day a piece is called alone. Tests call the piece directly and try what is forbidden.
- **The map is one file in the project** that a command can read. Forge reads it through `forge/project.md` → `areas`; it never keeps a second copy.

A good cut: an ordinary change touches one area. A bad one: ordinary changes keep touching two, or an area cannot be opened without going through another for nearly all its tests.

## 2. Tests of an area

- **An area is entered by state, never through another area's screens.** The session and the situation the test needs are put in place by a shared test helper that goes through the real write paths. A test of "plan" does not click through "login".
- **A contract test keeps that helper honest:** it compares what the real code writes with what the helper puts in place. Without it the tests enter a state that no longer exists.
- **The real entry stays tested for real** — sign-in in its own area, and a small suite of whole journeys across areas. That suite blocks a merge: it is what isolation cannot see.
- **Keep both kinds:** tests that open a screen cold by its address and tests that navigate to it. They do not find the same defects.

## 3. How Forge works in a project that has areas (`forge/project.md` → `areas`)

| Who | Does |
|-----|------|
| Plan (`/forge-plan`, `/forge-light`) | names the area or areas of the task in `task.md` Meta → `areas`. Two areas or more, or shared code: say so and why — it is a wider task, sized and judged as such |
| Code | stays inside those areas and the shared code they may use. While working: the unit tests of its area (`areas.test`). Needs something from another area → it goes to the shared code, or the task stops with a question; never a direct import |
| Main | after the work: `areas.check` and `areas.boundary`, then the full checks once (`forge/packs/core/skills/forge-pilot/SKILL.md` § C). `areas.changed` says which areas a change reaches; shared code reaches all of them |
| Review | reads **the diff of the map and of the exception register first**: that is where a bypass shows. A new exception, a raised count, a file moved to shared code that has one user, a member added to the area-facing face of the core → a finding `for: human`, with what it costs. The border lint red → `blocks merge? yes` |

## 3b. The sweeps in a project that has areas (`/forge-sweep`, `/forge-ux-sweep`, `/forge-chaos-sweep`, `/forge-code-sweep`, `/forge-regression`)

**Which area.** An area name in the request limits the run to that area: its features, its screens, its workflows, read from the map and `docs/features.md`. Several names are allowed.

**Nothing said, and a human is there** → main asks, once, through the host's question tool (`forge/packs/core/rules/asking.md`), before anything is started: *Which area do you want tested?* The question lists the areas by name, and offers:
- the areas that changed since the last sweep (`areas.changed`, or the lines of `epics/to-sweep.md`) — first, and recommended when there are any;
- the whole app;
- one area, typed by name.
A chaos sweep puts it in the same call as its question on testers and model.

**Nothing said, and nobody is there** (a scheduled run) → the whole app, as before. It never waits.

**What a run on one area leaves out, and says so.** The journeys that cross areas are not walked: the report names them under *Not tested* (`cross-area journeys — not walked, run on <area> only`). A finding whose cause is in the shared code is fixed only when the full checks pass afterwards, and its fix is verified on every area that uses that code; a sweep that cannot do that leaves it `open`, `why: shared code — needs a whole-app run`.

**The whole app** = every area, then **one pass of whole journeys across areas** (`areas.e2e`, or the cross-feature flows of the map). That pass is what a run area by area cannot see.

**The code sweep** reads one part per area and the shared code as a part of its own; on the whole app it adds one reader for the map and its exceptions. **The regression pack** carries the area of each scenario, and `--area` plays those alone; a scenario that crosses areas names them all and runs with each.

**Fix batches follow the areas**: one batch never mixes two areas, and what touches the shared code is a batch of its own, fixed last. Batches still run one after the other.

**The project has no areas, and the signs of § 4 are there** → the report carries the one finding of § 4 under *Needs you*, unless `areas.decision` is `later` or `declined`.

## 4. A project that has no areas

`/forge-init` looks once; a Review or a sweep says it again only when the signs are there and `areas.decision` is not `declined`.

**Signs that a cut would pay** (two or more, each one measured — a sign nobody can measure is not met):
- the full test run takes more than a few minutes;
- one central file nearly every change touches, or a screen or module of several thousand lines;
- one single table of routes or endpoints, and no command that tests one part;
- several people or agents work in it at the same time;
- an access rule that lives in one place by accident.

**Below that** — a handful of screens, tests under two minutes, one person — say nothing: a folder per journey is enough, and a map with its lint costs more than it returns.

What Forge writes then is **one finding addressed to the human**, non-blocking: the signs with their numbers, what a cut would cost (`forge/packs/core/rules/areas-split.md`), and the question. The answer goes in `forge/project.md` → `areas.decision` (`mapped`, `later`, `declined <date>`), so nobody asks twice.

**A new project** gets its areas from the start: `/forge-init` proposes them from the vision's journeys (§ 1), and the first task creates the map, the import rule and the per-area test command with the first area. That costs an hour then, and weeks later.
