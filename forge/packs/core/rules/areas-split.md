# Rule: cutting an existing project into areas

Load only when the human has decided the cut (`forge/packs/core/rules/areas.md` § 4). It is a large refactoring: plan it as a feature of several tasks, each judged, none changing what the user sees.

## Order — each step makes the next one safe

1. **Measure before.** Who uses what (members of the central module per screen), how long the tests take, which tests are unstable. The numbers decide the cut and prove the gain afterwards.
2. **Make the tests reliable.** Otherwise every move turns red at random and nobody can tell a broken move from a flaky test. On the measured project this was the most expensive step, and the one everything else stood on.
3. **Write the map and the per-area commands**, with a check that every file has an area. Tests are entered by state from here on (`areas.md` § 2).
4. **The import rule, with counted exceptions.** Have a reviewer try to get around it on its first version: a hand-written border has holes that only an attempt to cross it finds (a path from the root, a dynamic or computed import, a template or style reference, a bracket access to a private member…). Each hole closed gets a case in the rule's own tests.
5. **Routes or endpoints per area, on a common base.** Before moving anything, record the whole table and where every address leads in each sign-in state; a test compares the recomposed table.
6. **Take the shared core out first, with its two faces; then one slice per area** — the simplest first, the largest last. Cutting the central module by area before the core is out is not a move: most of its members touch the storage.
7. **Measure after**, with the numbers of step 1.

## What to expect

- **The map alone changes little.** Until the shared core is cut, nearly every change touches shared code and reruns everything (on the measured project, 2 % of commits would have run less).
- **Isolation holds for code and reading, not for journeys.** Unit tests of one area run in about a second; its browser tests still cross other areas. An application built from one area is not a way to run its tests.
- **The reviewers earn their place.** After green suites, they found a way to lift a lock, a rule that vanished when a piece was called alone, and nine ways round the lint.
- Fix rounds by the resumed author; a fresh fixer relearns the whole step (`docs/benchmarks/pilot-fix-rounds-2026-11-25.md`).

## Back end — principles, not measured

The measured project's back end is a hosted database with row rules and is not cut by area. Applied to a server, by reasoning only:
- an area is a module per business journey, with its endpoints and its use cases; the same import rule, the same counted exceptions;
- the shared core has the same two faces: data access with the access rules, and the internals;
- data has a clearer owner than on the front end: a table may belong to one area, and migrations and access rules are filed with it;
- a border between two areas can become a versioned contract; record the endpoint table before any move, as for routes.

Say `not measured` when you propose this to a human.
