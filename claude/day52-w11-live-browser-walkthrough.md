# D52 — Q-matrix editor live browser walkthrough (W11)

**Status: WALK RUN.** Two defects found and fixed; both re-verified live. D52's validity rules themselves closed in the same day's later commits (`0149ff2` / `e16473d`).

> **Restored 2026-09-13** from `956f6a1`, `94cda71`, `e16473d`, and `CHANGELOG.md`. The contemporaneous walk note was cited (`claude/day52-w11-live-browser-walkthrough.md`) and never committed. Session ids, screenshots, and extra findings are **not** reconstructed — none are in those sources.

---

## What the walk was

A live browser walk of the Q-matrix editor against a rebuilt Docker stack, after the partial D51/D52 land (`8ef0313`, 932/932). CHANGELOG's earlier Known-gaps line ("No live browser walkthrough of the Q-matrix editor has been run yet") is closed by this walk.

The walk is the source of two product bugs. Both were fixed in `956f6a1` and changelog'd in `94cda71`. Full suite after the fix: **932/932**.

`e16473d` later says the D51/D52 close (keyboard, validity mirror, F11/F12) was also "verified live in a browser rather than only in jsdom." That is a second live check the same day; it does not add named findings beyond the commit message.

---

## Finding 1 — "Save for Review" no-op on a brand-new Q-matrix

`transitionTo()` read `draft.id` from a closure captured before persist. `WizardStepContainer` calls `onSaveDraft()` then `onSaveAndReview()` using those closures. On a brand-new record the first "Save for Review" created the draft and never transitioned it to `reviewed`. No error was shown. A second click worked.

**Fix:** `draft.id` is mirrored into a ref, updated synchronously in `persist()`. `transitionTo()` reads the ref.

---

## Finding 2 — empty-row item silently discarded on reload

`entries[]` is sparse: an item with no attribute checked produces no rows. The editor's `includedItems` is ephemeral UI state. Saving a draft that contained an all-zero row therefore wrote a record that, on reopen, had neither the item nor its blocking "empty-row" error.

The blocking rule had been enforced only at Lock & Confirm.

**Fix:** `meetsReviewed` also requires `validity.errors.length === 0`, so an empty-row item cannot be saved as draft or sent for review.

---

## D52 validity rules (context for the walk)

Shipped with D51 (`2cb7628`). Pure functions in `QMatrixValidity.js`, shown live in the grid:

| Rule | Severity |
|---|---|
| All-zero row (item requires no attribute) | **Blocking** |
| Duplicate rows (same attribute set) | Advisory (was wrongly blocking; corrected before `8ef0313`) |
| Identifiability heuristic (no "pure" item for an attribute) | Advisory |
| Attribute-vs-item coverage (`< 3` items / attribute) | Advisory |

**Readiness mirror (`0149ff2` / `e16473d`).** An all-zero row is not expressible at rest, so the server cannot transcribe the client rule literally. At confirmation it checks the same defect from the other side: every deliverable item a bound diagnostic model will score must carry at least one entry. Client and server stay independent; a test asserts they agree (`qMatrixIntegrity.test.js`), following `taskModelStructure.test.js`. Advisory rules have no server half — by design.

---

## What this walk does not claim

- No session id, role, or URL is recorded in the commits.
- No WCAG audit. Keyboard / header / live-region work is D51's close (`e16473d`), not this walk's named findings.
- District read-only walk (`9870634`: tab present, no create/delete, editor disabled on an unlocked draft, `/district/q-matrices` resolves; 983/983) is a later, separate live check.

## Next

Route decision: `day52b-qmatrix-route-decision.md`. Item-row premise: `day52c-qmatrix-item-row-premise.md`.
