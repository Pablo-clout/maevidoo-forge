# Regression pack — {{project}}

> The scenarios that must always work. `/forge-regression` replays them the same way every time and says, for each one, *passes* or *broken*.
>
> **This file is yours.** Forge proposes scenarios and writes them here; change any word, add a scenario, remove one — your edit wins, and Forge will not reword what you wrote. Write what a person does and what they must see, in the words of the product. No code here: the scripts live in `tests/regression/` and are recorded again when you change a step.
>
> Each run starts from the same data (the project's reset). A scenario that creates a record names it `Regtest` followed by the time, so it never collides with real or seeded data.
>
> To remove a scenario for good, move its title under **Left out** with a word of why: Forge will not propose it again.

## R-1 · {{What the user comes to do, in one line}}
- why: <!-- core feature · money · rights · a bug that came back once · crosses loans and gear -->
- status: proposed {{YYYY-MM-DD}} — by forge <!-- or: confirmed — once you have read it -->
- area: <!-- the area or feature it belongs to -->
- start: <!-- who is signed in, and what must exist — the scenario creates the rest itself -->

1. <!-- what the user does → what they must see -->
2.
3.

- in the end: <!-- what must be true in the data, and where else it shows -->

<!-- A scenario no script can play (a real email to open, a printed page) gets one more line:
- how: by hand — <what stops a script>
-->

## Left out

<!-- one line each: the title — why it is not in the pack — date. Forge reads this before proposing. -->
