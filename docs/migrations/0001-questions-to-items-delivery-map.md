# Migration Map 0001 — `db.questions` (legacy) → `db.items` (ECD chain)

**Status:** Mapping complete, no code changed. Day 26, Week 6 ("Evidence Identification — the break that makes everything upstream inert").
**Date:** 2026-08-28.

This is the field-by-field map the plan calls for before touching `server/routes/sessionRoutes.js`. It is deliberately a document, not a diff — the actual migration (Days 27–28) reads this first. Produced from an exhaustive line-by-line sweep of `sessionRoutes.js`, `questionsRoutes.js`, `SessionPlayer.jsx`, `SessionForm.jsx`, `SessionList.jsx`, `SessionReport.jsx`, `reportsRoutes.js` and `calibrationRoutes.js`.

## 1. Headline finding: the legacy dependency is narrower than it looks, but two live bugs are riding inside it

`sessionRoutes.js` reads `db.questions` in exactly **two** places — not scattered everywhere:

- `POST /:id/submit` (IRT branch): maps the **entire** `db.questions` collection into an `itemBank` payload (`{id, a, b, c}` from `metadata.a/b/c`) sent to the R backend on every submit, regardless of which item was actually answered.
- `GET /:id/next-task` (IRT branch): finds one question by `task.questionId`, reads only `metadata.b`, picks whichever unanswered task's question has `b` closest to the current `theta`.

Everything else "question"-shaped in the session layer is either a passthrough ID string (`questionId` stored verbatim on a response, never dereferenced server-side) or lives entirely client-side (`SessionPlayer.jsx` fetching `/api/questions/:id` directly).

Two consequential bugs surfaced by this sweep, independent of the migration itself:

1. **MCQ scoring is silently broken today.** `SessionPlayer.jsx` computes correctness by comparing `question.correctOptionId` (singular) to the selected option — but `questionsRoutes.js` only ever writes `correctOptionIds` (plural array; the singular field is explicitly commented out, "legacy support"). `question.correctOptionId` is therefore always `undefined`, so every MCQ submission scores `0` regardless of the actual answer. **Do not port this comparison — Evidence Identification (Day 27) replaces it outright** with the item's own `scoring.evidenceActivationMap`, which is the intended fix, not a side effect of the migration.
2. **IRT parameters already have two disconnected homes even within the legacy shape**: `metadata.{a,b,c}` (what `sessionRoutes.js` actually reads) and a separate top-level `irtParams.{a,b,c,updatedAt,source}` (written by `questionsRoutes.js`'s `/sync-irt` endpoint, never read by `sessionRoutes.js` at all — a dead write path). The `items` schema already has a field named `psychometrics.irtParams` that looks like a direct target for the second one; §3 below flags why that needs a decision, not an assumption.

## 2. Route-by-route inventory (all 13 routes)

| # | Method + path | What it does today | Touches `db.items`? |
|---|---|---|---|
| 1 | `POST /` | Create session; validates `taskIds`, validates `selectionStrategy` against `db.policies` (existence only — never reads `policy.config`), initializes state. | No |
| 2 | `GET /` | List all sessions. | No |
| 3 | `GET /active` | List non-archived sessions. | No |
| 4 | `GET /archived` | List archived sessions. | No |
| 5 | `GET /:id` | Fetch one session. | No |
| 6 | `POST /:id/submit` | Record a response; validates `observationId`/`evidenceId`/`rubricLevel` against `db.taskModels`→`db.evidenceModels` (real ECD chain, evidence-structure only); IRT-only: rebuilds the whole question-derived `itemBank` and calls the R backend to update `studentModel.irtTheta`. | No |
| 7 | `GET /:id/next-task` | Adaptive selection: `fixed` (sequential), `IRT` (closest-`b`-to-theta over `db.questions`), `BayesianNetwork` (info-gain over `db.taskModels`/`db.evidenceModels`, **never persists the resulting posterior**). `MarkovChain` has **no branch at all** — falls through to `res.json({})`, silently breaking any session created with that strategy. | No |
| 8 | `POST /:id/pause` | `status → "paused"`. | No |
| 9 | `POST /:id/resume` | `status → in_progress`, guarded on currently paused. | No |
| 10 | `POST /:id/finish` | `status → "completed"`, `isCompleted → true`. **Never sets `finishedAt`/`autoFinished`**, though both are declared in the schema and read by the client. | No |
| 11 | `POST /:id/review` | `status → "reviewed"`, `isCompleted → true`, `reviewedAt → now`. | No |
| 12 | `POST /:id/archive` | `status → "archived"`. | No |
| 13 | `DELETE /:id` | Admin-only hard delete. No cascade into `db.tasks`/`db.questions` (unlike `questionsRoutes.js`'s own `DELETE`, which does cascade). | No |

**`db.items` is referenced by zero of these 13 routes.** The real Item Bank chain is completely absent from session delivery today — confirmed by exhaustive grep, not inferred.

## 3. Field-by-field map: legacy `db.questions` shape → real `items` schema

Legacy shape reconstructed from `questionsRoutes.js` (no schema.js declaration exists for `"questions"` at all — `validateEntity("questions", ...)` unconditionally returns `{valid: false, errors: ["Unknown collection"]}` today, so `POST`/`PUT /api/questions` already fail validation as written, independent of this migration).

| Legacy `db.questions` field | Read by | Real `items` field | Migration note |
|---|---|---|---|
| `id` | join key everywhere | `id` | Direct. |
| `stem` | `SessionPlayer.jsx` render | `stimulus.blocks[]` (a text block) | Reshape: one string → a composed block array. `stimulus.layout` (`single`\|`composite`\|`passage_based`) has no legacy equivalent — must be inferred or authored fresh. |
| `type` (`mcq`\|`rubric`\|`constructed`\|`open`\|`reading`) | `SessionPlayer.jsx` branch logic | `interaction.type` (`mcq`\|`multiselect`\|`numeric`\|`constructed`\|`likert`) | **Not 1:1.** Legacy `type` conflates two things `items` keeps separate: the response widget (`interaction.type`) and the scoring approach (`scoring.method`: `binary`\|`partial`\|`rubric`\|`numeric`\|`performance`\|`likert`). Legacy `"rubric"`/`"open"` don't exist as `interaction.type` values at all — `"rubric"` is a `scoring.method` with `interaction.type: "constructed"`; `"open"` has no direct interaction-type equivalent and needs a decision (`constructed`, presumably). `"reading"` (passage) has no equivalent anywhere in `items` — see the passage gap below. |
| `options[]` (`{id, text}`) | `SessionPlayer.jsx` mcq render | `interaction.responseComponents[]` | Direct in spirit, different field shape — needs a small adapter, not a redesign. |
| `correctOptionIds[]` (plural; singular `correctOptionId` is dead, see §1) | Intended for scoring | `scoring.evidenceActivationMap[]` (`{responsePattern, activatesObservable, strengthOverride, rationale}`) | **Conceptual replacement, not a rename.** "Correctness" stops being a flat correct-ID comparison and becomes "does this response pattern activate the observable" — this is the exact shift Evidence Identification (Day 27) exists to make. Do not build a `correctOptionIds`-shaped compatibility layer; build against `evidenceActivationMap` directly. |
| `bnObservationId` | Bayesian-network selection join | `observationId` | Direct rename, but `observationId` carries more weight in the real chain — it's the pointer into the Task Model's `expectedObservations` and, transitively, the Evidence Model's `observables[]`. |
| `metadata.{a,b,c}` | **The actual IRT read path** (submit's itemBank rebuild, next-task's `b`-based selection) | Ambiguous — two candidates exist, see below | See "The IRT parameter question" below; this is the one field this map does NOT resolve, deliberately. |
| `irtParams.{a,b,c,updatedAt,source}` | Nobody in `sessionRoutes.js` (dead write path, only written by `questionsRoutes.js`'s `/sync-irt`) | `psychometrics.irtParams.{a,b,c,updatedAt,source}` | `items` already has an identically-shaped, identically-named field. Notably, `items` having exactly ONE such field (not two, unlike the legacy split) already avoids re-introducing this exact fragmentation — but see below for whether it should be populated at all. |
| `status` (`new`\|`review`\|`active`\|`retired`) | `questionsRoutes.js` lifecycle route | `status` (`draft`\|`reviewed`\|`confirmed`\|`operational`\|`suspended`\|`archived`) | **Different enum, not a subset.** Needs an explicit state map, not a passthrough: `new→draft`, `review→reviewed`, `active→operational` (plausible), `retired→archived` or `suspended` (needs a decision — legacy conflates "temporarily pulled" and "permanently done" into one state; `items` distinguishes them). |
| `creator` | — | `creator` | Direct. |
| `usageCount`, `maxUsageBeforeRetire`, `reactivationCount`, `maxReactivations` | **Nobody** — `sessionRoutes.js` never calls anything that increments these (this is exactly what Day 29, "`record-usage` — exposure control becomes real," fixes) | `exposureControl.{usageCount,maxUsageBeforeRetire,reactivationCount,maxReactivations}` | Direct field-for-field move into a nested object. Already dead on the legacy side too — not a regression to carry forward, a bug to fix on schedule (Day 29). |
| `passageId`, `subQuestionIds` | `SessionPlayer.jsx`'s reading-comprehension flow (fetches a second question by `passageId`, reads `passage.type`/`subQuestionIds`) | **No equivalent field anywhere in the `items` schema.** | **Real gap, not just a rename.** Two plausible directions, neither implemented: (a) a passage is one `stimulus` with `layout: "passage_based"` and `blocks[]` holding the shared passage content, with each sub-question a separate `item` sharing that stimulus; or (b) a composite `taskModel` (`taskCompositionType: "composite"`, `subTaskIds`) where each sub-task is its own confirmed item. This needs a design decision **before** Day 27 writes reading-comprehension delivery, not during. |

### The IRT parameter question this map deliberately leaves open

`sessionRoutes.js` today reads `metadata.{a,b,c}` — a flat, always-current-looking copy with no provenance. The real chain has **two** places this could come from, and they are not equivalent:

1. `items.psychometrics.irtParams.{a,b,c}` — a flat convenience copy on the item itself, structurally identical to the legacy `irtParams` field.
2. `evidenceModels.statisticalModels[].parameterSets[]` (the actual calibration record, per Day 19's schema and ADR 0002/0003) — the canonical, provenanced source (`packageVersion`, `converged`, `sampleSize`, `calibratedAt`), resolved live by pointer.

ADR 0003 (composite-library denormalisation boundary) already answered this question for composite-library *packages*: calibrated parameters are never baked in, always resolved live by pointer, specifically so recalibration takes effect immediately. The same reasoning applies here with equal force — if Evidence Identification/Accumulation reads `items.psychometrics.irtParams` as a cached copy, it reintroduces the exact "two disconnected homes" bug this sweep found in the legacy shape, just moved one level down. **Recommendation for Day 27: read parameters from `statisticalModels[].parameterSets[]` via the item's `evidenceModelId`, and treat `items.psychometrics.irtParams` as either unused or a display-only snapshot — never the value delivery actually scores against.** This is a recommendation, not a decision made here; Day 27 should confirm it explicitly before writing code, per the ADR 0003 precedent.

## 4. `sessions` collection — field usage today (unaffected by the question/item shape, but load-bearing context for Days 27–28)

| Field | Written | Read | Note |
|---|---|---|---|
| `taskIds`, `currentTaskIndex` | create, submit | next-task (all 3 branches), submit | Core sequencing state, shape-agnostic — survives the migration unchanged. |
| `responses[]` | submit (push) | submit (IRT payload, skip-answered check), next-task (skip-answered check, both IRT and BayesianNetwork) | Each response carries a bare `questionId`; post-migration this becomes `itemId`, and the skip-answered checks need no other change. |
| `studentModel.irtTheta`/`.stderr` | submit (IRT branch only, via R backend call) | next-task (IRT branch) | Only IRT strategy updates ability at all today. |
| `studentModel.bnPosteriors` | **Nowhere** — computed inline in next-task's info-gain calc but never persisted | next-task (BayesianNetwork branch, always falls back to the 0.5 default because nothing ever writes it) | **Real bug, independent of the question/item migration.** Worth fixing in the same pass as Evidence Accumulation (Week 7–8) since that's where posterior persistence belongs anyway. |
| `nextTaskPolicy` (`{policyId, ...}`) | create (from the matched/explicit policy) | **Nowhere** — confirmed by exhaustive grep | `db.policies[].config` is validated to exist at session-create time and then completely ignored. Every selection strategy is a hardcoded inline branch; Activity Selection (build reference Step 23, "existing policies re-pointed at the library") has not happened yet even in the legacy path. |
| `selectionStrategy` | create | submit (gate the IRT branch), next-task (branch selector) | `"MarkovChain"` is a valid enum value (`schema.js`'s `policies.type`) and selectable in `SessionForm.jsx`, but next-task has no `MarkovChain` branch — falls through to `res.json({})`. A session using it cannot progress. Flagging for Day 27/28 scope, not fixing here. |

## 5. What this means for Day 27's scope

Evidence Identification's stated job (build reference Part 2, Step 25) is: apply the item's `evidenceActivationMap` against the bound Evidence Model's evaluation procedures, output **Observable Variable values, not a score**. This sweep confirms that is a strictly larger and more correct replacement for what exists today (a broken singular-field comparison for MCQ, and nothing at all server-side for other types) — there is no legacy scoring logic worth preserving or porting. The migration is additive/replacement, not a refactor of working logic.

Three decisions Day 27 needs before writing code, none resolved here on purpose (this document maps state, it doesn't make architecture calls beyond what ADR 0003 already settled):

1. **IRT parameter source** — `psychometrics.irtParams` vs. live `parameterSets[]` lookup (recommendation above, not a decision).
2. **Passage/composite reading-comprehension shape** — no existing field covers it; needs either a `stimulus.layout: "passage_based"` convention or a composite-task-model convention, decided once rather than improvised item-by-item.
3. **`type` → `interaction.type` + `scoring.method` split** — specifically what `"open"` (legacy) becomes, since it has no obvious 1:1 target today.

Independent bugs found and *not* fixed here (out of scope for a mapping day, listed so they aren't rediscovered by surprise later): MCQ scoring always `0` (§1); `bnPosteriors` never persisted (§4); `nextTaskPolicy`/`policy.config` never consulted (§4); `MarkovChain` has no next-task branch (§4); `finishedAt`/`autoFinished` never set despite being schema fields the client reads (§2, route 10); `"questions"` and `"tasks"` have no `schema.js` declarations at all, so `validateEntity` unconditionally fails for both today, independent of anything this migration touches.
