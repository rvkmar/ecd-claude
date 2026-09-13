# D52c — Q-matrix item rows are not "the bound Task Model"

**Status: PREMISE WITHDRAWN.**

> **Restored 2026-09-13** from `e16473d`, `CHANGELOG.md` Known gaps, and `QMatrixEditor.jsx`. The contemporaneous note was cited and never committed.

---

## What the original spec said

Item rows in the Q-matrix editor should be scoped to **"the bound Task Model."** `8ef0313` and the first changelog Known-gaps line recorded that the shipped editor did not do this, and left the premise "unresolved."

## What actually shipped (and still ships)

Rows are items the author explicitly adds, drawn from:

```
item.evidenceModelId → evidenceModel.competencyId → competency.modelId
```

— the same chain `useItemListData` already derives elsewhere. Not the whole item bank (meaningless and unusable at scale). Not a Task Model's `itemMappings`.

Only explicitly added items become rows, so D52's "no all-zero row" rule is a real authoring mistake rather than every unaddressed item in a large bank.

## Why the spec sentence was a layer confusion

`e16473d` withdraws the premise rather than implementing it:

> in ECD the Task Model is where we measure, while the constellation of items is the Assembly Model's role and the matrix belongs to the Evidence Model's measurement model. The shipped scoping already matches what the scoring engine enforces.

CHANGELOG restates the same resolution: Task Model = task *environment*; which items belong together is the Assembly Model; the matrix belongs to the Evidence Model's measurement model.

The delivery runtime already refuses a response whose Q-matrix row requires no attributes (`attributeAccumulation.js`). Confirmation's server-side blocking rule (`lifecycleValidation.js`) asks the same question from the stored side: every deliverable item a *bound diagnostic Evidence Model* will score must appear in `entries[]`. That join is Evidence Model → items, not Task Model → items.

Scoping rows to a Task Model would have shown a different — and, at confirmation, unenforced — set.

## Consequence

No code change. The Known-gaps line is **Resolved**. Authors keep picking items that share the competency model; diagnostic confirmation still keys off the Evidence Model binding D53 creates.
