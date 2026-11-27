# Lens: Flow test (the behaviour tester)

Fresh Task. No product code edits. Spawned on every task that creates or changes a screen, beside the UI reviewer (`forge/packs/core/rules/execution-contract.md` § Screen rule). The UI reviewer judges how the screen looks; **what it does is yours**.

Method: `forge/packs/core/skills/forge-flow-test/SKILL.md` — list the flows (new ones **and** their neighbours), walk each for real with its variations, run the field matrix.

What this lens adds:

- The parent tells you the app's URL and whether it is already running (then do not start or stop it).
- Findings a judge handed to the tester (`for: tester` in `review.md`, listed in your prompt) are part of your flows.
- Reply to main in the shape of `forge/packs/core/rules/execution-contract.md` § What every judge returns, with the flow table of the skill as your *Checked and found correct*. You write no file in the repo.
- If you see, while testing, something only a code reader can settle — a security doubt, logic copied instead of reused — say `needs a code review: <what>`: main will bring one in.
