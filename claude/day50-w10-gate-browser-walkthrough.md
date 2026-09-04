# D50 — W10 walkthrough: the measurement core reached from a browser

**Status: GATE MET.** Tier 3, never-compress, run alone.

**Exit check:** *A student, in a browser, answers an item and the session's SMV posterior moves, with `usageCount` incrementing.* **Passed** — and it took a P0 fix to get there.

---

## The result

| | |
|---|---|
| Where | `stud1`, browser pane, `/student/sessions/s1788530196992/player` |
| Posterior on `smv-d50` | prior 0 → **0.4662** (1 response) → **0.7625** (2 responses) |
| SEM | 1.0 (prior) → 0.8847 → **0.8108** |
| `usageCount` | **0 → 1** on all three items |
| `scoredValue` | **`null` on every response** |
| Provenance | every response tagged `parameterSource: "calibrated"`, `parameterSetId: "ps1788530264443"` |
| Stack | Docker at `localhost:6060`, rebuilt from `b06de7c` |

This is the first time in the project's history that the D26–D38 measurement core has been reached by a real user through the interface. Weeks 6 and 7 were true of the test suite; they are now true of the product.

---

## F7 — the P0 the walkthrough existed to find

**The session player could not be routed to with a session id, from any role.**

Found by observation before any code was read: navigating to `/student/sessions/<id>/player` fell through to the dashboard, and the Play tab reported "Session id not provided."

Root cause, two halves:

1. `SessionPlayer` derived its id from **one** source — a regex on `window.location.pathname` matching `/sessions/(s\d+)/player`. **No route in `App.jsx` has ever produced that shape.** Every role registers `sessions/play` (no id) and `sessions/:sessionId/review` (wrong suffix). The component never read `useParams()`.
2. `/student/*` rendered `<StudentDashboard />` with **no nested `<Routes>`**, so every deeper student URL rendered the dashboard.

**This is the navigation half of F1.** D47 closed what happens *after* an item is delivered; nothing could get a student to a session in the first place. The district/teacher `/sessions/:sessionId/review` route was broken by the same cause.

**Fix (`b06de7c`, minimal):** `useParams()` becomes the primary id source (accepting `sessionId` or `id`); the legacy regex stays as a fallback for bookmarked URLs, widened to match `/review`; `/student/*` nests its own `<Routes>` with `sessions/:sessionId/player`, mirroring `/district/*` and `/teacher/*`. The review routes are repaired for free.

**Regression test** `src/components/sessions/__tests__/sessionPlayerRouting.test.jsx`, mutation-tested: reverting the id derivation fails 2 tests, reverting the route fails 1, restored passes 5. It includes a *static* assertion on `App.jsx`, because the defect was the ABSENCE of a route — no amount of rendering the component detects that.

---

## Three findings from building the chain

### 1. Nothing can go operational on pilot parameters

`readinessErrorsFor()` (evidenceModels.js) requires `parameterSets.length` and `activeParameterSetId` before an Evidence Model may activate. An operational Item requires an operational Evidence Model. `recordItemUsage()` refuses any item that is not operational.

**Therefore `usageCount` can never increment on the pilot path.** D38's pilot-parameter work scores correctly and moves a posterior, but a pilot chain can never accrue exposure. That may well be the right policy — you should not run a live administration on hand-entered numbers — but it is nowhere written down, and it means the W10 gate is only reachable through a calibrated chain.

Reached here by hand-entering parameters through `POST /evidenceModels/:id/recalibrate`, which accepts arbitrary `parameters` with **no convergence flag, no standard errors, no package version** and stamps `calibrationMethod: "manual"`. ADR 0002 requires all three. The parameter set is flagged in its `notes` as walkthrough-only.

### 2. `POST /api/calibrate/:evidenceModelId` cannot calibrate an ECD chain

It is pre-ECD code. It calls R at `R_BACKEND_URL || "http://r-backend:8000"` — the container publishes **4000** and `R_BACKEND_URL` is commented out in `docker-compose.yml` — and on success it writes `a`/`b`/`c` onto **`db.questions[].metadata`**, the legacy collection. It never touches `statisticalModels[].parameterSets[]`, the only thing activation accepts. Fold into D61–D63.

### 3. Calibrated parameters are keyed by `observableId`; pilot parameters by item

`parameterSet.parameters[observableId]` (evidenceAccumulation.js:1001) vs `item.psychometrics.irtParams`. My three items with distinct difficulties (b = −0.4, 0.0, +0.4) all resolved to the single calibrated `b = 0.0`. Item-level difficulty survives calibration only if a parameter set is keyed per item. **Decide before D68** (calibrated-supersedes-pilot).

---

## What the walkthrough confirmed working

- **D47 end to end.** `ItemPresenter` rendered the numeric interaction; submit sent `itemId` + `rawAnswer` and nothing else. `scoredValue` is `null` on all three stored responses — F3 closed by demonstration in a live deployment.
- **D49a end to end.** Promoting the Task Model to `operational` minted `cl1788530277898000`, `itemCount: 3`, zero warnings, `active: true`, `stale: false`. The compiled entry carries `evidenceRule` and `evidenceActivationMap` and **no `a` or `b` anywhere** — ADR 0003's boundary holding in production data.
- **F6 closed live.** `POST /api/tasks` returned 201 three times, each task carrying `itemId`. Task authoring through the API had never once succeeded before D47.
- **Refuse-don't-guess.** The deliberately wrong answer (0.75) matched no declared `responsePattern`. It did **not** score as a failure: `activated: null`, `warning: "Work product did not match any declared responsePattern on item ..."`, and the posterior recorded `responsesExcluded: 1`. An unmatched response is not evidence of non-mastery, and the exclusion is reported in two places rather than swallowed.
- **Governance gates fired correctly** and each one was a real constraint, not ceremony: IRT + `stimulusPolicy: "static"` refused; MCQ refused against a `numeric_response` observable; a confirmed item required at least one response component; an Evidence Model refused activation with no confirmed Task Model bound to it; a continuous competency required a scale.

---

## Compression debt

| Unit | What was compressed | Why | Discharge by |
|---|---|---|---|
| D50 | The **district and teacher** role passes. The plan says "across all four roles"; admin and student were walked in full. | Each additional role costs a human login, which I cannot perform. The gate itself is a student action and was met. | **D71** (full core browser pass, W15) |

The district/teacher review route was repaired by the same F7 fix but **was not exercised in a browser** — it is asserted only by unit test. Treat it as unverified until D71.

---

## The walkthrough chain (left in place, in Mongo)

| Entity | Id | State |
|---|---|---|
| Competency Model | `cm1788529919891` | confirmed, `smv-d50` continuous, N(0,1) on [−4, 4] |
| Competency | `c1788529936020` | scale −4..4 |
| Evidence Model | `em1788529998770` | **operational**, active set `ps1788530264443` (manual, flagged) |
| Task Model | `tm1788530077519000` | **operational** → package `cl1788530277898000` |
| Items | `it_…_004/005/006` | **operational**, `usageCount: 1` each |
| Tasks | `t…652/661/669` | each carrying `itemId` |
| Session | `s1788530196992` | `in_progress`, 3/3 answered, **not finished** |
| Policy | `p1788530196984` | fixed |

The session was deliberately left unfinished so the state is inspectable. Nothing here is fixture data in a test file — it is real records in the running deployment.

---

## What remains

- **`StudentDashboard`'s "My Sessions" tab is still `<div>Upcoming/Active Sessions here</div>`.** A student can now be *routed* to a session but cannot *discover* one. Deliberately not folded into the F7 fix. **Its own unit.**
- **W10 is closed.** D46 (Phase-2 `apiFetch` consolidation) remains open and blocks nothing.
- **D49c** — library as the delivery source — still sequenced with D56. F4 stays half-open.
- The three findings above feed D61–D63 (R + calibration contract) and D68 (calibrated supersedes pilot).

## Next

W11 — the Q-matrix editor block (D51–D55), which is the first block that can be built on a delivery path proven to work.
