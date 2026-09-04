# Day 47 — Server-authoritative item delivery

**Exit check (D47):** A submit carrying a falsified `scoredValue` is ignored on the item path;
persisted observable values match `identifyEvidence()` exactly; the legacy path is unchanged and
still passes its own tests.

**Status: DONE on its server-side exit check. Browser verification outstanding — that is D50's
block gate.**

## Verification

- `NODE_OPTIONS=--max-old-space-size=3072 npx vitest run` — **902/902 passing, 47 test files**
  (880/880 across 46 before this day).
- `npm run build` — clean; the pre-existing >500kB chunk warning is unchanged (D74's item).
- Four mutants applied and caught. See "Mutation results" below.
- Device and container trees compared file-by-file: all six D47 files byte-identical
  (`git hash-object` match on each).

## What the premise check corrected before any code was written

The plan said `/next-task` returns a `questionId` and would need a server-side change. **It does
not.** `GET /api/sessions/:id/next-task` returns `{taskId, strategy, debug}` and nothing else; the
*task record* carries the pointer, and the player resolves it. `sessionRoutes.js` already carries a
comment saying item-based selection there is "a separate, larger Activity Selection undertaking" —
which is D56.

So D47 turned out **smaller** than the previous session's revision claimed, and it stays out of
D56's territory entirely. The earlier revision over-corrected an earlier error.

## What was delivered

**`task.itemId` — a task names the item it presents**, exactly as it has always named a question.
One pointer, validated on both sides (Part 1.3's second invariant), rather than re-deriving the
item at delivery time from `taskModel.itemMappings` — which the project itself treats as
best-effort until D154 makes it authoritative. Building the delivery path on data the project calls
unreliable would be a quiet failure by construction.

`tasksRoutes.js` validates, at authoring time, exactly what the delivery path will later require:
the item exists; its `taskModelId` matches the task's (Day 30's adversarial-review finding, so a
task cannot be created that `/submit` would refuse); and it is not `suspended`/`archived`. A draft
item is still bindable, matching Day 29's preview/test-delivery design. A task naming **both** a
`questionId` and an `itemId` is refused as ambiguous — the player and the scorer must never be able
to disagree about which record was answered. The same rules apply on `PUT`, checked against the
*merged* record rather than the payload.

**`ItemPresenter.jsx`** — a separate renderer for items, deliberately not a widening of the
question renderer. The legacy path is still what every real session uses and is the fallback if
anything here is wrong; two renderers sharing one submit path is a smaller blast radius than one
renderer with two shapes threaded through it. It reports the examinee's raw response and nothing
else — no `correctOptionId`, no `isCorrect`, no `scoredValue`, asserted statically in its test. An
interaction type it cannot present **refuses** rather than rendering blank and letting a null
response be recorded as though the examinee had chosen it.

**`SessionPlayer`** resolves `task.itemId`, renders through the presenter, and submits
`{taskId, itemId, rawAnswer}` — no `scoredValue`, no `questionId`, no `itemMappings` lookup.

## F3, stated precisely

The plan said "the client computes the score." True, but the consequence is narrower than it
sounds, and the precision matters:

- **The ITEM path never read the client's `scoredValue`.** It builds a work product from
  `rawAnswer` alone and calls `identifyEvidence()`. That was designed correctly on D28.
- **The LEGACY path stores it verbatim** — `scoredValue: scoredValue !== undefined ? scoredValue :
  null`. That is where F3 actually lives.

So D47 closes F3 by migration, not by fixing scoring logic. Both facts are now pinned by tests: the
first so it cannot regress, the second so that the day the legacy path is retired or hardened, the
test fails and forces the finding to be closed deliberately rather than drifting shut.

## FINDING F6 — discovered mid-unit, and it is older than the project

`POST /api/tasks` and `PUT /api/tasks/:id` have returned **400 for every request since the
repository's first commit.**

Both called `validateEntity("tasks", ...)`. `tasks` has never had a schema block in
`src/utils/schema.js` — `git log -S` finds no commit that ever added one — and `validateEntity`
returns `{valid: false, errors: ["Unknown collection"]}` for an undeclared collection,
unconditionally. So task authoring through the API has never worked. Every task in the system was
seeded directly into the store, and TasksManager's create action is a button that cannot succeed.

This blocked D47's own exit check: an item-backed task could not be created at all.

**Fixed by removing the impossible calls** and having the route enforce what it actually depends
on. Giving `tasks` a real schema block is a schema-design unit in its own right (Part 8, "one
entity per session") and bundling it into a measurement cutover would break that rule — so the
absence of a `tasks` schema block is recorded as an open gap, not silently accepted.

**Note for the D48 guard:** `collectionSurfaceGuard.test.js` checks that every schema collection
has a route. It does not check the reverse — that every mounted route has a schema block. Had it
done so, F6 would have surfaced on D48. That reverse check is worth adding.

## Mutation results

Every assertion was verified to bite:

| Mutation | Caught by |
|---|---|
| Remove the both-pointers ambiguity check | 2 tests |
| Remove the taskModel-match check | 1 test |
| Make the item path read the client's `scoredValue` | static + live walkthrough |
| Restore the impossible `validateEntity("tasks", …)` call | 4 tests |

## The behavioural proof

`d47ItemWalkthrough.test.js` runs the real routes against real persistence (the scratch-db
convention day35/day38 established):

- Tasks created through the **real** `POST /api/tasks` with an `itemId` — itself the F6 regression
  test.
- A **wrong** answer (`opt_b`) submitted with `scoredValue: 999`. The observable still refuses to
  activate. The client's claim has no effect.
- Two submissions of the **same** answer, one honest and one carrying a fabricated score, record
  identical `activated`, `observationId`, `evidenceModelId` and `parameterSource`.
- The posterior moves and `responsesUsed` reaches 3.

## What remains

1. **Browser verification is not done.** The `SessionPlayer` changes have component coverage but
   have never run in a browser. That is D50's block gate ("a student, in a browser, answers an item
   and the session's SMV posterior moves") and it is the honest gap in this day.
2. **`tasks` has no schema block.** Recorded as an open gap; its own unit.
3. **The legacy `questionId` path is still fully reachable** and still honours client-supplied
   scores. Retiring or hardening it is not in W10's scope and should be scheduled deliberately.
4. **No authoring UI** for binding an item to a task — chosen scope for this unit. TasksManager
   still offers only a question.
5. The `/next-task` selection strategies still read `db.questions` for their IRT `b` parameter.
   Unchanged, and correctly D56's.

## Next

**D49 — composite library activation wiring.** Note it is partly overtaken: D48's rebuild endpoint
already gave `buildCompositeLibrary()` its first caller, so what remains is the activation path,
plus the dead-export guard that would have caught F4 and G4. D49 must also carry D48's discovery
that the builder degrades rather than throwing — the activation path has to refuse an empty package
exactly as the rebuild endpoint does, or promotion silently produces an active package that
resolves to nothing.
