# Code sweep — the axes

What each reading looks for, and what counts as proof. A reader loads **its own reading only**. These are questions to put to the code, not a list to tick: an axis with nothing wrong is said in one line under *Read and found sound*.

Stack rules come on top: the enabled packs' own rules for the files in question (`forge/packs/core/rules/pack-loading.md`).

---

## Reading: risk

### Security
- **Who may call this, and on whose records?** Follow every route, action, job and message handler from where it enters to where it reads or writes. A check on the screen is not a check. An id taken from the request and used without asking *is it theirs?* is the most common hole there is.
- **Where does outside text end up?** In a query, a shell command, a file path, a template, the page, a log, a redirect, a regular expression. Built by joining strings → say which input reaches it.
- **Secrets and personal data**: in the code, the history of a config file, a log line, an error returned to the client, a test fixture, the browser's storage, a URL.
- **Sessions and tokens**: how long they live, where they are kept, what signing out really ends, what a password change invalidates.
- **What is trusted that should not be**: a role sent by the client, a price or a total computed in the browser, a webhook with no signature, a file type from its name, an origin from a header.
- **Limits**: a size, a count or a rate that nothing bounds on something anyone can call.
- *Proof*: the route, the line where the check is missing, and the request that shows it — or the path the value follows.

### Data and database
- **Writes that must succeed or fail together** and do not: two saves with no transaction, a file written before the row, a counter updated beside its source.
- **What the database lets in that the code assumes cannot exist**: a missing unique or foreign key, a nullable column read as always there, a state that only the screen forbids.
- **Queries that grow with the data**: one query per row of a list, a list with no limit, a filter or a sort on a column with no index, a whole table loaded to count it. Say which table grows and how fast.
- **Two requests at once**: read–then–write with nothing between, a check and an insert that both pass, the last write silently winning.
- **Migrations**: one that cannot run on a table with data, cannot be rolled back, locks a large table, or was edited after it shipped; a model and a schema that no longer say the same thing.
- **Deleting**: what stays behind (orphans, files, a cache), what a soft delete still shows, what the law would want gone.
- **Time, money, ids**: local time stored as if universal, amounts in floating point, rounding done twice, ids that can be guessed.
- *Proof*: the two lines that should be one unit; the query and the missing index; the sequence of two calls that breaks it.

### Correctness and error handling
- **Errors that vanish**: an empty `catch`, a promise nobody awaits, a failed call treated as an empty answer, a default that hides a missing value.
- **What the user is told when it fails** — and whether what they typed survives.
- **The second call, the late call, the call out of order**; a retry that does the thing twice.
- **Edges the code never met**: empty, one, very many, the boundary date, the string that is a number, the absent optional field.
- **State kept in two places** that can disagree: a cache and its source, a total and its lines, memory and the screen.
- *Proof*: the input and the line where it goes wrong; a test that exists and should fail, or the three lines of one that would.

### Performance
Only what someone will feel, and only with a number or a growth law.
- **Work that grows with the data** on a path that runs often: a loop in a loop over lists that grow, a full recomputation on every keystroke, render or request.
- **What is loaded and not needed**: the whole record for one field, the whole library for one function, every image at full size, everything at start-up.
- **What is done again and could be kept**; what is kept forever and never freed (listeners, timers, an unbounded cache).
- **What blocks**: a slow call made in sequence that could go together, synchronous work on the path of a request or of the interface.
- *Proof*: a measurement when you can make one; otherwise the growth law and the size at which it hurts (`n rows × m lines: 200 × 40 = 8,000 queries for one page`). "Could be faster" is not a finding.

---

## Reading: structure

### Architecture and borders
- **Does the shape match what the product does?** A part named after a table, a screen or a technical layer, where the users' journeys cut across it.
- **Who depends on whom**: an import from one area into another, a cycle, shared code that knows its users, a low layer that calls a high one. With areas: the map, the exception register and how it grew (`forge/packs/core/rules/areas.md`).
- **Where a rule lives**: a business rule in a screen or a controller; the same rule in the browser and on the server with no single source; an access rule that exists in one path and not in the other.
- **The file everyone touches**: a central module, a god object, a "utils" that grew. The hotspots of the code map are the first suspects.
- **What is hard to change that should be easy**: a vendor or a framework reached from everywhere instead of from one place.
- *Proof*: the import lines; the three places that hold the same rule; the change that needed five files and why.

### Dead and duplicated code
- **Nothing calls it**: an export, a route, a flag that is always off, a branch that cannot be reached, a file no build includes, a dependency nobody imports, a migration for a table that is gone. Search before you say it — a name built at run time is not dead.
- **Written twice**: the same logic in two places that have **already drifted apart** is a defect; identical copies are debt. Two things that look alike and mean different things are neither.
- **Left behind**: commented-out blocks, debug output, a compatibility path for a version nobody runs, a `TODO` older than a year on a path that matters.
- *Proof*: the search that returns no caller; the two blocks side by side and the line where they differ.

### The tests
- **Do they prove anything?** A test with no assertion, one that asserts what it just mocked, one that passes when the code under it is removed. Pick the three tests that guard what matters most in your part and ask what breaking the code would do to them.
- **What matters and has no test**: a money path, an access rule, a migration, the unhappy path of the main flow.
- **What is in the way**: tests that fail now and then, tests that must run in an order, tests skipped with no reason, a suite so slow nobody runs it — with its measured time.
- **Tests tied to how, not to what**: they break on every refactoring and catch no defect.
- *Proof*: the test and the change to the code that it would not notice.

### Comments, names and layout — can it be read?
- **Comments say why, and they are true.** Missing where the code is surprising: a workaround, an order that matters, a number with no name, a rule that comes from the product. Wrong where the code moved on and the comment did not — a comment that lies is worse than none. Useless where it repeats the line under it.
- **What a module is for** can be read at its top or from its name, without opening its callers. The same for a function that others call: what it takes, what it gives back, what it changes, when it fails.
- **Names**: one word for one thing across the part; no name that lies about what the code does; no abbreviation only its author knows.
- **Layout**: a file holds one subject; a folder says what belongs in it; things that change together sit together. A function that needs scrolling to be read, or six levels of nesting, hides its own logic. The same order of things from file to file (imports, constants, helpers, exports).
- **The documents a newcomer needs**: how to run it, how to test it, where things live. Present, and still true.
- *Proof*: the surprising line and what a reader would wrongly assume; the comment beside the code it contradicts; the function and its length; two names for one thing, with their places. Count before you report: "comments are thin" is nothing; "9 of the 13 helpers other files call say nothing of what they return" is a finding.

### Maintainability and the practices of the stack
- **Can the next person understand this part without its author?** A function that does five things, a name that lies, a flag that changes what a function means, a comment that contradicts the code.
- **Types and contracts that say nothing**: `any`, a dictionary of anything, a silenced check — on a border where data comes in.
- **The framework fought instead of used**: what it offers and the code rebuilt by hand, worse; a deprecated API on its way out; a known trap of the stack (the pack's "Do not" list).
- **Configuration**: values that differ per environment written in the code; a setting with no default and no check at start; a build nobody can reproduce.
- *Proof*: the function and what it took you to understand it; the deprecated call and where its removal is announced.

---

## Reading: system (once, over the whole scope)

What no part shows alone.
- **The map as a whole**: does each area still hold what its name says; what grew in the shared code and has one user; what was moved there to get around the border rule; the exception register — every entry still needed?
- **How it starts, is configured, logs and fails**: one way or five; what happens to the others when one part is down; whether an error can be followed from the user's screen to its cause.
- **Dependencies**: known vulnerabilities and how they are reached from this code; a library far behind on a path that matters; two libraries for the same job; one abandoned by its authors; one imported for a single small function.
- **The build and the delivery**: what a new developer must do to run it; what is checked before a merge and what is not; a step done by hand and from memory.
- **What is the same problem everywhere**: say it once, with its places.

## Reading: data (once, when the project stores data)

The model as a whole, before any part's use of it.
- **Does the schema say what the product means?** Entities and their relations against `docs/vision.md` and the features; a concept the product has and the schema spreads over three tables or hides in a text field.
- **What the schema guarantees and what only the code guarantees**: uniqueness, presence, references, allowed states.
- **Who writes each table**: one owner, or several parts each with their own idea of the rules.
- **The migrations, in order**: can a fresh database be built from them; do they match the models; what would the largest table make of the latest one.
- **Growth**: which tables grow without bound, what is never archived or deleted, what the indexes are for.
- **Personal data**: where it is, who can read it, how it is removed.
