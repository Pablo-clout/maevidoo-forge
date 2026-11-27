# Chaos angles — the tool's walks, the testers' temperaments, and what the tool counts

Read by `/forge-chaos-sweep`. Two things turn here, so that no two runs and no two testers do the same thing:
- the **angles** of the tool's blind walks (`run-chaos.mjs`);
- the **temperaments** given to the free testers.

## Temperaments — one word per free tester

A temperament is a starting point for a tester, never a script: it only makes two testers of the same workflow start differently.

| Temperament | In one line |
|-------------|-------------|
| `impatient` | Clicks before things finish, double clicks, does not read. |
| `clumsy` | Wrong field, wrong format, typos, pastes odd things, presses the wrong key. |
| `curious` | Opens everything, tries every option and every menu, looks for the edges. |
| `stubborn` | Insists: retries what failed, goes back and forth, does the same thing five times. |
| `distracted` | Leaves in the middle, comes back later, reloads, changes its mind, keeps two tabs. |
| `hostile` | Tries to break it: absurd values, markup in fields, URLs edited by hand, what belongs to someone else. |
| `newcomer` | Knows nothing, follows what the screen says literally, gets lost where the screen is unclear. |

## Tool angles — `run-chaos.mjs` walks them by itself

| Angle | What it does |
|-------|--------------|
| `wander` | Clicks links and buttons at random, scrolls, goes back. |
| `impatient` | Triple clicks, reloads right after a click, goes back and forward in the middle of things. |
| `dirty-input` | Fills every field with hostile values, each in turn (empty, spaces, 500 characters, emoji, markup, quotes, right-to-left text, absurd numbers and dates), and submits. |
| `keyboard` | Tab, Shift+Tab, Enter, Space, Escape and arrows only. No mouse. |
| `flaky-network` | Uses the screen while the network goes slow, drops and comes back. |
| `small-screen` | A 320px phone that rotates and changes size while being used. |

The same `--rng` gives the same walk on the same app, and `--replay` runs a recorded walk again, action for action.

## What the tool counts — a closed list

A signal of the tool's walks is one of these, and nothing else: `chaos.mjs note` refuses any other kind. The free testers are not bound by this list: they judge like a person (`worker.md`).

**Hard — broken on sight:**
- `uncaught`: an error nobody caught;
- `server-error`: the server answered 5xx;
- `blank-page`: the screen shows nothing;
- `injected-script-ran`: a value typed into a field was executed;
- `data-lost`: something the user entered or saved is gone;
- `data-duplicated`: one action created two records;
- `access-granted`: a user saw or changed what belongs to another user or role.

**Suspect — measured, but a judge must look:**
- `console-error`: the app logged an error;
- `duplicate-request`: one action sent the same write twice;
- `silent-failure`: a write failed and the screen did not change;
- `sideways-scroll`: the page is wider than the screen;
- `dead-end`: nothing is left to act on;
- `stuck-busy`: still loading 5 seconds after the last action;
- `no-feedback`: an action failed and the user is told nothing;
- `state-not-kept`: what was on screen is not there after a reload or a way back, where the app promises it is.
