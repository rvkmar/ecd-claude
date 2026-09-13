# D51 — Q-matrix editor (W11)

**Status: DONE** (first landed as partial; closed later the same day).

**Exit check (reconstructed from commits):** an attributes×items Q-matrix can be authored against a competency model's binary Student Model Variables, saved through the D48 collection surface, and confirmed under D52's blocking validity rule. **Met** at `e16473d`. Keyboard operability, header exposure, and the row-count badge were part of the close, not of the first commit.

> **Restored 2026-09-13** from `git log`, `CHANGELOG.md`, and comments in `src/components/qMatrix/*`. The contemporaneous note `claude/day51-w11-calibration-and-qmatrix-editor.md` was cited from the first changelog write (`7714c8d` / `8ef0313`) and never committed. No walk, test count, or finding below is claimed beyond those sources.

---

## First land (partial) — `2cb7628` / `8ef0313` (2026-09-10)

`2cb7628` built the surface. `8ef0313` immediately recorded that it was **not** complete against the calendar spec.

**What shipped**

- `QMatrixGrid` — presentational attributes (columns) × items (rows) checkbox grid; named design tokens only.
- `QMatrixValidity` — D52 rule functions (see below). Shipped in the same pair of commits.
- `QMatrixEditor` — single screen, not a multi-step wizard. Reuses `WizardStepContainer` as a one-step shell for Save / Review / Return-to-draft / Lock & Confirm.
- Rows are items the author **explicitly adds**. Scoping uses the existing chain `item.evidenceModelId → evidenceModel.competencyId → competency.modelId` (see `day52c-qmatrix-item-row-premise.md`).
- `QMatrixList` / `QMatrixModelBuilder` — list ↔ editor shell, no Dashboard sub-tab.
- Wired into `AdminPage` as a new **"Q-Matrix" tab**.
- Tests and a Storybook story for the grid. Full suite at this close: **932/932** (918 baseline + 14 new). Build clean.

**What the spec called for that this commit did not ship** (`8ef0313`):

| Divergence | Later fate |
|---|---|
| No dedicated `/admin/q-matrices` route | Kept as a tab on purpose — `day52b-qmatrix-route-decision.md` |
| Competency Model picker listed every model, including ones with no binary SMV | Closed at `0149ff2` (`hasBinarySmVariable`) |
| Item rows not scoped to "the bound Task Model" | Premise withdrawn — `day52c` |
| No virtualization above a stated row count | **Still open** (CHANGELOG Known gaps) |
| No keyboard interaction | Closed at `e16473d` |
| No server-side strict validator / readiness-mirror test | Closed at `0149ff2` / `e16473d` (blocking rule only) |
| Duplicate-row rule was blocking confirm | Corrected to advisory before `8ef0313`, matching the D52 spec |

The first changelog entry therefore labelled both D51 and D52 **partial**.

---

## Close — `0149ff2` / `e16473d` (2026-09-10)

`e16473d` records D51 + D52 as completed against their own exit checks, verified live in a browser rather than only in jsdom. **969/969** tests (33 new); seven guards mutation-tested.

**D51 half that closed here — grid interaction and accessibility**

From `QMatrixGrid.jsx` and the `e16473d` message:

1. **Roving tabindex.** The grid is one tab stop; arrows move inside it with edge clamping. A 20×5 matrix is no longer 100 tab stops.
2. **Space toggles** the focused cell.
3. **Range select** from the last-toggled anchor: shift-click, or Shift+Space as the keyboard equivalent. A mouse-only range gesture inside a "fully keyboard-operable" surface would have been the defect the rule exists to catch.
4. **Range select is one batched `onSetCells`**, not a loop of `onToggleCell`. The editor's toggle handler closes over current `entries[]`; looping it would drop every cell but the last. Same stale-closure family as the Save-for-Review no-op (`956f6a1`).
5. **Headers** via `<th scope="col">` / `<th scope="row">` plus `role="grid"`. Cell changes announced in a polite live region, including how many cells a block selection affected.
6. **Severity is never colour alone.** Each row shows a literal attribute count; an item that requires none is readable as `"0"` without seeing red.

**Also in this close, D51 picker filter (`0149ff2`):** the Competency Model picker only lists models that declare at least one binary Student Model Variable. The current selection stays visible even if it would not qualify as a fresh pick, so an existing record is not stranded.

---

## Integrity fixes that landed with the close

These are D51/D52-adjacent and recorded on `e16473d` / `0149ff2`:

- **F11.** DELETE filtered on `sm.qMatrixId`. Schema and `attributeAccumulation.js` use `sm.structureConfig.qMatrixId`. The guard had never fired; a Q-matrix underwriting a live DINA model could be deleted. Fixed.
- **F12.** No locked guard, so a confirmed Q-matrix could be destroyed. Archive instead — same rule confirmed items already follow.

---

## What remains (D51)

- Grid is **not virtualised** above a stated row count. Still listed in CHANGELOG Known gaps.
- Advisory D52 rules (duplicate row, identifiability, low coverage) have no server-side equivalent — by design; they were never meant to block. The one blocking rule is enforced on both sides, with a test asserting agreement.

District read-only Q-matrix (`9870634`, later the same day) is not this unit. It reused the editor behind `readOnly`.

## Next

D52's live walk, route decision, and item-row premise are separate restored notes. D53 is the Evidence Wizard DINA/G-DINA panel.
