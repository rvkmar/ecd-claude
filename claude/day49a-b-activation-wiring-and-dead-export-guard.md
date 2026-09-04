# D49a + D49b — composite library activation wiring, and the dead-export guard

**Status: BOTH DONE.** Tier 2 + Tier 1 pair, as calibrated.

**D49a exit check:** promoting a Task Model to `operational` produces a versioned ACTIVE library record and deactivates the previous one; an un-instantiable Task Model is refused rather than given an empty active package; reactivation behaves as decided; recalibration alone changes nothing (ADR 0003). **Met.**

**D49b exit check:** the guard exists, is scoped to `server/`, excludes tests from the caller corpus, carries a reasoned baseline, and is **demonstrated to fail** when a production caller is removed — not merely observed to pass. **Met, four ways.**

---

## Verification

| | |
|---|---|
| Commit | `29836e1` (device), applied from container `c0e0a3e` — all six changed files hash-identical on both sides |
| Tests | **913 passed / 913, 48 files** (was 902 / 47) on vitest 5.0.0 |
| Build | clean |
| Mutation tests | 4, all correct — see below |

Not verified in a browser. The Docker stack still serves the pre-D49 image; that confirmation rides with **D50**, which needs a rebuilt image anyway.

---

## D49a — F4's missing caller

`buildCompositeLibrary()` now has the caller finding F4 said it never had.

### What was built

**`server/compositeLibrary/activation.js` (new).** One definition of compile → refuse-if-empty → deactivate-previous → validate, exported as `compileAndActivate(taskModel, db)`. It mutates the snapshot and does not save, so a promotion writes the Task Model and its package in a single `saveDB()` rather than leaving a window where one landed and the other did not.

D48 had written that sequence inline in the rebuild route. Copying it into the promotion path would have left two definitions of "activate a package", free to drift — and a drift between two modules that independently decide which items are deliverable is the exact failure class this project keeps finding (F4, G4, F6, the D48 guard's blind spot). `compositeLibraryRoutes.js` now delegates to the shared module; its local `genId` went with it, so the two creation paths share one counter and cannot mint the same id inside a millisecond.

**Wired into the LOCKED status-only branch of `PUT /api/taskModels/:id`.** That is the only route reaching `operational`: confirmation sets `locked = true`, every state reachable from confirmed stays locked, and `canTransition()` offers `operational` only from `confirmed` or `suspended`.

**Reactivation recompiles, deliberately.** `suspended → operational` is a Task Model re-entering service, and the item bank may have moved while it was out — items archived, new items confirmed. Serving a package compiled before the suspension would deliver a snapshot of an item bank that no longer exists. The previous package is deactivated, never deleted, so anything already scored against it stays explicable.

### The decision that was open, and how it went

The plan's exit check said an Evidence Model version bump should *"trigger a rebuild"*. **Rejected.** That makes writing one entity silently recompile another entity's delivery artefact, with nothing in the request saying so.

**Chosen: mark stale, surface the advisory, require an explicit rebuild.** `GET /api/compositeLibrary/:id/staleness` (D48) reports it; `POST /api/compositeLibrary/rebuild/:taskModelId` (D48) fixes it. Reasons: it is how every other cross-entity effect in this codebase behaves — refuse or advise, never act quietly; and adding auto-rebuild later is additive, while removing it later is a behaviour change. A test pins it by asserting `compileAndActivate` is called exactly once in that router, inside the `operational` branch.

### Where the plan was wrong — the empty-package refusal is unreachable

The 409 was specified as the unit's safety net. It cannot fire on the promotion path.

`validateTaskModelLifecycle()` refuses to activate unless at least one item matches `(taskModelId, taskModelVersion)` with status in confirmed/operational/suspended. `buildCompositeLibrary()` selects items with **exactly that filter**. Remove the items and the lifecycle gate answers 400 long before the builder runs. The first version of the test tried to force the 409 by stubbing `db.items.filter` and got a 400 — which is the proof, not a failure.

**It was kept, and reframed.** It is now a *coherence assertion* between two modules that independently define "a deliverable item": dead weight today, and the only thing that would catch them drifting apart tomorrow. It is tested directly against `compileAndActivate` rather than through a route contorted to reach it, and the route-level test now asserts the honest behaviour — the lifecycle gate refuses first, the Task Model does not go live, no package is minted, nothing is saved.

On the **rebuild** path the same 409 is a genuine user-facing refusal: that endpoint has no lifecycle gate in front of it.

---

## D49b — the guard, and what measuring first changed

Tiered Tier 1 on the assumption that adding it is mechanical. Measuring the tree first changed the unit.

**164 exports have no production caller: 11 in `server/`, 153 in `src/`.**

### Three design decisions, each of which the guard is useless without

**1. Test files do not count as callers.** F4's own description is *"exercised by its own tests — and invoked from nowhere in `server/` or `src/`"*. A guard whose caller corpus included tests would have seen `buildCompositeLibrary` in `builder.test.js` and passed it. This exclusion is the entire point.

**2. Comments do not count either.** The first working version read raw text — so a commented-out call would keep an export looking alive, going quiet at exactly the moment it should fire. **This is the D48 trap, reproduced.** Adding `liveCode()` stripping unmasked **three more** exports that only looked alive because prose named them: `dbAdapter.js :: DB_MODE`, `usersRoutes.js :: createUserRecord`, `evidenceModels.js :: calibrationGate`. All three are used several times inside their own module and nowhere else — the `export` keyword is what is unnecessary, not the code.

**3. Scoped to `server/`.** The 153 `src/` findings are dominated by React Query hooks built ahead of their screens — `useQMatrixModels`, `useCompositeLibrary` and friends, shipped D48 with no UI **by design**, because the seven-artefact contract requires the hooks and W11 schedules the screens. A guard failing on all 153 would be switched off within a day. Revisit a client-side guard after W11.

### Baselined, not cleaned first

14 entries, each with a written reason — "unused" is the observation, not a reason. The baseline is checked in **both** directions: a new dead export fails, and an entry that has *acquired* a caller must be removed, so the list cannot rot into a place dead code hides.

### Mutation tests — the part that decides whether it is worth having

| Mutation | Required | Actual |
|---|---|---|
| Delete both production callers of `compileAndActivate` | FAIL | FAIL |
| **Comment out** those callers instead | FAIL | FAIL |
| Add a live export to the baseline | FAIL (rot check) | FAIL |
| Restore | PASS | PASS |

### The two suspicious exports, triaged — both benign, both checked

- **`sessionsDependingOnItem`** — reached through its own wrapper `liveSessionsForItem()`, which *is* called. Separately, `itemsRoutes.js`'s DELETE inlines its own answered-session check (`r.itemId === item.id`) and refuses with a 409. Nothing is unguarded.
- **`DIAGNOSTIC_MODEL_FAMILIES`** — used three times inside `evidenceAccumulation.js`'s own dispatch. `sessionRoutes.js` imports the CONTINUOUS and RAW_SCORE lists but deliberately **not** this one: DINA/G-DINA has no item-level pilot field, so a diagnostic family with no calibrated parameter set falls through to an explicit refusal rather than getting an invented fallback. Correct as written, not a missing branch.

### `mathjs` removed as a live dependency

`sessionRoutes.js:16` imported `log2` and **never called it** — `entropy()` has always used native `Math.log2`. It was mathjs's only reference in `src/` or `server/`, and two test files carried widened timeouts specifically to absorb its cold-import cost. An unused import was buying real test flakiness. The import is gone and both comments corrected.

**`mathjs` is still listed in `package.json`.** Deliberately not removed: the dependency list and lockfile were rebuilt by hand two commits ago, and unpicking them is the user's call, not a side effect of this unit.

---

## What remains

- **D50** — Tier 3, never-compress, the W10 block gate. Unblocked. **Needs a `docker compose build` first** — the running stack predates D47, D49a and D49b. Fingerprint before trusting it (procedure in `claude/day49-calibration-and-verification-surface.md`). Its likely obstacle is still that no UI binds an item to a task, so expect to seed a task carrying `itemId`. Discharges D47's compression debt.
- **D49c** — library as the delivery source. Sequenced with D56, needs a written snapshot-vs-live decision first. **F4 stays half-open until then.**
- **D46** — Phase-2 `apiFetch` consolidation. Blocks nothing.
- **Deletion candidates** surfaced by the guard, none urgent: `STATUS_ORDER` and `isPromotion` (lifecycleMatrix is the source of truth), and the three unnecessary exports above.
- **A client-side dead-export guard** after W11, when the screens that consume the 153 hooks exist.

## Next

D50, on a full budget, after a Docker rebuild.
