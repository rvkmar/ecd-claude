# D54 — Assembly Model wizard / readiness

**Status: DONE.** Built unverified with D53b (`530e3d4`); suite verified (`0281453`); autosave defect re-applied and live-walked (`a73a619`).

**Exit check (reconstructed from commits + CHANGELOG):** Assembly Models can be authored end-to-end in the Admin UI — identity, per-attribute targets, stopping rules, selection algorithm bound to a policy, readiness review before confirm. Schema, routes, and validation already existed (D17/D48). **Met.**

> **Restored 2026-09-13** from `530e3d4`, `0281453`, `a73a619`, `CHANGELOG.md`, and `src/components/assemblyModels/**`. The contemporaneous notes cited in those commits (`claude/day54-d53b-and-d54-built-unverified.md`, `claude/day55-d53b-d54-live-verification.md`) were never committed.

---

## What was already true

D48 had given `assemblyModels` CRUD, admin-gated writes, lifecycle transitions, and query hooks. There was no authoring UI. Stopping and selection still did not consume the model (D56). `requiredClassificationAccuracy` was visible and unevaluated (D57).

## What shipped (`530e3d4`)

Five-step wizard at `/admin/assembly-models` on the shared wizard shell (`WizardSidebar` / `WizardStepContainer`):

1. Identity
2. Targets by SMV
3. Stopping rules (`maxItems` / `minItems` / `targetsMet` only — there is no `coverage` field)
4. Selection algorithm (requires `policyId`)
5. Review — readiness rows that hand-mirror `validateAssemblyModelLifecycle`

`AssemblyModelList` / `AssemblyModelBuilder` mirror the Q-matrix list/shell (no Dashboard sub-tab). Admin-authored per `rolePermissions.js`: a system-level measurement decision, not local authoring.

Save/review/confirm go through `useTransitionAssemblyModel()` — one PUT does content and status, same shape as `QMatrixEditor`, not a dedicated lifecycle route.

**Readiness mirror.** `canProceed` and Step 5 encode the server lifecycle checks by hand rather than importing `lifecycleValidation.js`. **No mirror-agreement test.** Flagged in `AssemblyModelWizardContext.jsx` and still open in the progress ledger (discharge: W12 close).

## Built, not verified (`530e3d4`)

Same session as D53b. npm 403 for the whole session; no vitest, no build, no Docker. The commit says not to consider the unit done until the suite runs green.

## Suite verification (`0281453`)

**1023/1023** passing (full run 1021 + 2 confirmed in isolation). This is the first honest green for D53b + D54.

## Autosave defect and live walk (`a73a619`)

`schema.js` requires `selectionAlgorithm.policyId` on **every** save, including draft. Unlike the other wizards, there is no "create now, fill later." An auto-save on leaving Step 2 or Step 3 was always refused (`selectionAlgorithm.policyId is required`).

The gate is keyed on whether the draft actually has a `policyId`, not on step number. First persist waits until Step 4 is complete. Once a record exists, saves resume on subsequent Next. Locked records skip save (read-only paging).

`a73a619` also adds the missing `.dockerignore` (host `node_modules` / `dist` / `.git` were overwriting the Linux image). That is infrastructure, not D54 product scope, but it is why the live walk could trust the rebuilt stack.

**Live walk (named in `a73a619`):** no save on Step 2→3 or 3→4; first real `POST /api/assemblyModels` at Step 4→5 once a policy is set; full lifecycle to Reviewed, then Confirmed+locked.

The wizard's classification-accuracy copy later stopped saying the target was unevaluated (D57/D58). At D54 close it still disclosed that the target was not enforced.

## What remains

- No readiness-mirror agreement test (ledger D54 row, open).
- Session is not bound to a specific Assembly Model. Ambiguous match → none applied (D56 kept that refusal; still true).
- D55 WCAG audit was not this unit and was not run.

## Next

D55 was the W11 accessibility audit — skipped. D56 consumes this model for selection and stopping.
