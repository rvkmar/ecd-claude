# D58 — persist the stop and show it

**Status: DONE** for the revised unit. Live walk of a *diagnostic* session hitting the new ending screen was **not** executed.

**Exit check (revised on contact):** *A session that meets an Assembly Model accuracy target before `maxItems` gets `{ stopped }` from `next-task`; that object is persisted on the session; the player shows the reason rather than "No more tasks available."* **Met in tests.** Mutation: deleting `data?.stopped` from `SessionPlayer.jsx` fails `sessionPlayerStopReason.test.jsx`.

The plan's original exit check also said "shown" on session detail / report header / session list Badge. Those three surfaces were **not** this unit after rewrite — they belong with D59.

---

## Where the plan was wrong

The calendar and action plan said *write `delivery/sessionOrchestrator.js`; loop and stop; end on accuracy, length, or coverage*.

What was already true at `b68f308` (D57):

- There is no orchestrator. Loop/stop lives in `selectNextActivity` / `evaluateStoppingRules` (`activitySelection.js`). D56 already ends a session on `maxItems` / `targetsMet`. D57 filled classification into that path.
- **`coverage` is not a `stoppingRules` field.** Schema allows `maxItems`, `minItems`, `targetsMet` only. It was not invented.
- `GET /api/sessions/:id/next-task` already *returned* `{ stopped }` and **did not persist it**. Session status still changes only on `/finish`.
- `SessionPlayer` treated any response without `taskId` as **"No more tasks available."**

D58 therefore did not add a second decision site. It closed the delivery loop on the existing module.

---

## What was delivered

- Persist `{ stopped }` (rule, assemblyModelId, reason, optional targets, `stoppedAt`) on the session the first time `next-task` fires a stop. Status stays `in_progress`. Later `next-task` returns the persisted record even if the Assembly Model is later gone.
- Schema validation for `sessions.stopped` (`maxItems` | `targetsMet` only).
- Player reads `data.stopped` and `session.stopped`; heading + reason + classification/SEM details.
- Assembly Model wizard / route comments no longer say classification accuracy is unevaluated (D57 discharge).
- Tests: `sessionRoutes` persist + authority, schema refusals, `measurementStop` copy, player render + static `data?.stopped` assertion.

**Commit:** `ede5f33` — *D58: persist Assembly Model stop decisions and show them in the session player* (2026-09-13 13:16 IST). Later HEAD `eb58055` is unrelated routeAuth flake fixes.

---

## Verification

| | |
|---|---|
| D58 files (Linux container, earlier) | 4 files, **55/55** |
| Full `npx vitest run` this close (Linux, `NODE_OPTIONS=--max-old-space-size=3072`) | **736 passed** across 34 files; **27 unhandled worker-start timeouts** (forks pool); exit 1. Build did not run in that same command. Not a D58 failure — workers for `repoGuards`, `usersRoutes`, `evidenceModelLifecycle`, and others never started. Last fully claimed suite on this repo was 1023 at `0281453` (pre-D56). |
| `npm run build` (Linux container, after) | **clean** — `dist/assets/index-BI7xatQh.js` 2242.57 kB (pre-existing >500 kB chunk warning; D74) |
| Browser | App is HTTP on `:6060`, not HTTPS (nginx `listen 80`). Admin Assembly Model wizard opens at `/admin/assembly-models`. **No live student session was driven to a measurement stop.** |
| Working tree at close | handoff + ledger only (this commit). `master` matched `main/master` at `eb58055` before the close commit. |

---

## What remains

- **Live player walk** of a session that stops on `targetsMet` (especially diagnostic classification). Tests cover the copy; cadence still wants the behaviour in a browser. Fold into **D71** with the D50 district/teacher pass and D56 adaptive-selection walk.
- **D59** — role-split reports, attribute-profile UI, close the leak that any authenticated user can `GET` `teacher-report`.
- **D60** — never-compress adversarial review of selection/stopping. Own session, different agent. Do not start on leftover budget.
- D55 WCAG audit never run (standing risk: missed W11 close).
- Student "My Sessions" tab is still a placeholder.
- `https://localhost:6060` fails SSL because nginx does not terminate TLS.

---

## Next

D59 (revised): split existing `SessionReport` / `reportsRoutes` by role; add the D57 classification to the report; stop fetching teacher content for an examinee.
