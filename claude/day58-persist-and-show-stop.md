# D58 — persist the stop and show it

**Status: DONE.**

**Exit check (revised on contact):** *A session that meets an Assembly Model accuracy target before `maxItems` gets `{ stopped }` from `next-task`; that object is persisted on the session; the player shows the reason rather than "No more tasks available."* **Met** — in tests and in a live student player.

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

**Code commit:** `ede5f33` — *D58: persist Assembly Model stop decisions and show them in the session player* (2026-09-13 13:16 IST).

---

## Live walk (exit check, executed)

| | |
|---|---|
| Where | `stud1`, `/student/sessions/s1789288381307/player`, Docker HTTP `:6060` |
| Assembly Model | `am-d56`, `targetsMet`, `minItems: 2`, `maxItems: 8`, classification accuracy 0.8 |
| After 2 mastered DINA responses | Player heading **Measurement target met** |
| Reason shown | *Every reported Assembly Model target is met (1 of 1) at 2 response(s).* |
| Classification shown | `attrA: master (confidence 0.95)` |
| Not shown | "No more tasks available." |
| Persisted | `session.stopped.rule === "targetsMet"`, `stoppedAt` set, status still `in_progress` |

A parallel API trace on `s1789288355960` returned the same `{ stopped }` shape from `next-task` after the second submit.

The one-off walk harnesses (`scripts-d56-playwright.cjs`, `scripts-d56-playwright-finish.cjs`, `scripts/seed-d56-walk.mjs`) stay on disk and are **gitignored** (`0efe535`). They hardcode a student password and machine-local temp paths; they are not product code.

**Finding for D60:** the AM targeted `attrA` *and* `attrB`, but only `attrA` appeared in `stopped.targets` ("1 of 1"). Unmeasured attributes are not in `assemblyProgress`, so `targetsMet` can fire before every *declared* target has evidence. That may be correct ("reported" ≠ "declared") or premature stopping — the review should say which.

---

## Verification

| | |
|---|---|
| D58 files (Linux container) | 4 files, **55/55** |
| Full `npx vitest run` at first close (Linux, heap 3072) | **736 passed** / 34 files; **27 unhandled worker-start timeouts**; exit 1. Not a D58 failure. Last fully claimed suite: 1023 at `0281453` (pre-D56). |
| `npm run build` | **clean** — `index-BI7xatQh.js` 2242.57 kB (pre-existing >500 kB chunk warning; D74) |
| Browser | HTTP `:6060` (nginx has no TLS). Live stop screen demonstrated as above. |
| Remote | `master` matches `main/master` after the close commits. |

---

## What remains

- **D59** — role-split reports, attribute-profile UI, close the leak that any authenticated user can `GET` `teacher-report`. Session list / report header still do not show the stop reason.
- **D60** — never-compress adversarial review of selection/stopping, including the "reported vs declared targets" finding above. Own session, different agent.
- D50 district/teacher pass, D56 adaptive-selection live ranking walk — still D71.
- D55 WCAG audit never run (standing risk: missed W11 close).
- Student "My Sessions" tab is still a placeholder.
- `https://localhost:6060` fails SSL because nginx does not terminate TLS.

---

## Next

D59 (revised): split existing `SessionReport` / `reportsRoutes` by role; add the D57 classification to the report; stop fetching teacher content for an examinee.
