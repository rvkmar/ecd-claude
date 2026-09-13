# D56 — Activity Selection reads the library and live posteriors

**Status: DONE** in tests. **Not** walked in a live browser (compression debt → D71).

**Exit check (from `b321959` / `activitySelection.test.js`):** (1) a fixed-policy session is byte-identical to pre-D56; (2) IRT selection reads the active composite-library package and the session's live SMV posterior. **Met** in the unit's own file. Full run: **1074/1076** (53 new); the two failures are the standing `repoGuards` / `routeAuth` full-run flake (both pass in isolation).

> **Restored 2026-09-13** from `b321959`, `server/delivery/activitySelection.js`, `CHANGELOG.md`, and ADR 0003. No contemporaneous `claude/day56-*.md` was committed.

---

## Why this file exists

Step 23 of the ECD cycle — the last box in Fig. 12's loop. Identification, Accumulation, and Assembly Model targets already existed; the arrow from Accumulation **back** to Activity Selection did not.

Until D56 the three strategies lived inline in `GET /:id/next-task` (~115 lines) and read `db.questions`. D40 had already named that gap. The handler becomes a short delegation to `server/delivery/activitySelection.js`.

## What "reads the library" means

A candidate's **structural** facts come from the active `compositeLibrary` package for its Task Model (ADR 0003). Item **parameters** stay live — they are not in the package — so a recalibration takes effect on the next selection, and an uncalibrated item can still be chosen on author-supplied pilot values (`resolveContinuousParameters` / `resolveDinaParameters`).

D49c is **not** claimed closed here. Identification still walked the authoring graph until `2090d6c`.

## What "reads the live posterior" means

`session.studentModel.smvPosteriors`, written by `applyPosteriorsToSession()` on every submit. Not `irtTheta` (legacy R-backend only). Not `bnPosteriors` (nothing in production writes it).

## Strategies

- **`fixed`** — byte-identical to the pre-D56 branch. Pinned by a reference oracle that reproduces the old branch verbatim, including the absence of any key it did not emit.
- **IRT** — same selection criterion as before (nearest difficulty to the current estimate, **not** maximum Fisher information). Only the inputs moved. Max-information is held for the unit that checks against a published benchmark.
- **BayesianNetwork** — see F24.

## F24 — the BN strategy had never run

The pre-D56 branch gated every Evidence Model on `em.measurementModel?.type !== "BayesianNetwork"`. `measurementModel` appears nowhere in `schema.js`, samples, or seed data; nothing writes it. Evidence Models carry `statisticalModels[]`. The guard failed for every model, `gain` stayed 0, `bestGain` started at `-Infinity`, and the first unanswered task always won. Plausible enough that nothing looked wrong.

`bnPosteriors` is written only by a test fixture.

**Fix:** score candidates by expected information gain over the diagnostic mastery posteriors the session actually accumulates. A session with no diagnostic data still gets the next unanswered item, and now **reports** that fallback.

**Second error in the same dead branch:** expected entropy weighted correct/incorrect at 0.5/0.5 regardless of the real marginals, understating an item's value (commit: 2.4× at prior 0.8; CHANGELOG: "more than half in some cases"). `computeExpectedInformationGain` weights by `P(u=1)` and `P(u=0)`.

## Stopping (length and SEM; not classification)

Assembly Model `minItems` / `maxItems` / `targetsMet` now govern, consuming `assemblyProgress.js`. A classification-accuracy target stays **unevaluated** and cannot stop a session — D57's job.

Governing model is **inferred** from the session's competency-model chain. Zero or more than one confirmed/operational match → none applied, not guessed. **No `assemblyModelId` on sessions** (schema unit; cadence contract). Ambiguous sessions get no stopping rules.

## Deliberately not built

- No `assemblyModelId` on sessions (above).
- Legacy `db.questions` branch is **quarantined**, not deleted. Item-based sessions never touch it. Question-based sessions select as before.
- Maximum Fisher information held for benchmark work.
- D49c not closed.
- Mixed item + legacy sessions: only item-based tasks are ranked (the two ability estimates are not on a common scale).

## Verification

| | |
|---|---|
| Own tests | `activitySelection.test.js` organised around the two exit-check halves + F24 |
| Full run | 1074/1076; 2 standing flakes, pass in isolation |
| Browser | **Not walked.** Ledger D56 row → D71 |

## Next

D57 — evaluate `requiredClassificationAccuracy` (ADR 0004). D56's tri-state `targetsMet` filter is already written to accept a real boolean.
