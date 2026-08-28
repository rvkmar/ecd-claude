# ADR 0003 — Composite library denormalisation boundary

**Status:** Accepted
**Date:** 2026-08-28 (Day 20, Week 4)
**Deciders:** ecd-claude build
**Depends on:** Day 19's `compositeLibrary` schema (`src/utils/schema.js`)

## Context

The build reference defines Composite Library as "a compiled versioned package
built at Task Model activation: per item, presentation material + interaction
params + evidence rules + weights of evidence. Compiles Task Model → items
(templates deferred)." Day 19 declared the schema shell
(`{taskModelId, taskModelVersion, compiledAt, active, items[]}`); the builder
(`compositeLibrary/builder.js`, walking Task Model → items → evidence models) is
Day 24. Before that builder is written, this ADR has to answer: what does it
actually bake into the compiled package (denormalise), and what must stay a live
lookup at request time?

Getting this wrong in either direction has a real cost:
- Denormalise too little → Evidence Identification/Accumulation (session delivery,
  a real-time path per ADR 0001/Part 4.1's "milliseconds" requirement) re-joins
  Task Model → Items → Evidence Models → Observables on every single response,
  which is both slow and re-derives the same structural facts on every request.
- Denormalise too much → a live fact (calibrated parameters, usage counts, an
  in-progress student's posterior) gets duplicated into the compiled package,
  creating exactly the "same fact stored twice" problem CLAUDE.md's invariants
  already warn against project-wide, and specifically reintroduces staleness the
  moment that fact changes without a full recompile.

## Decision

**Compiled into `compositeLibrary.items[]` at build time** (structural facts that
only change when the Task Model, its bound Evidence Models, or its Items are
themselves revised):

- Presentation material references and interaction params per item (what to show,
  how to capture a response) — static once an item is confirmed/operational.
- The item's evidence-activation mapping: which observable(s) it targets, and the
  evidence rule (direction, strength, activation condition) bound to each —
  structural facts owned by the Task Model / Evidence Model pairing, not by any
  one student's session.
- Weights of evidence needed for accumulation math (the CTT/threshold/sum weight,
  or the evidence-rule strength feeding IRT/Bayes/DINA update).

**Resolved live at request time, never denormalised into the package:**

- **Calibrated statistical model parameters** (`statisticalModels[].parameterSets[]`
  / `activeParameterSetId`, per Day 19's schema). Referenced by pointer
  (`evidenceModelId` + `statisticalModelId`), fetched live on each use. This is the
  load-bearing boundary line: recalibration (a new parameter set, or flipping
  `activeParameterSetId`) must take effect on the next delivery immediately,
  with no library recompile required. Baking parameters into the compiled package
  would mean every recalibration silently does nothing until someone remembers to
  rebuild every package that used it — a correctness bug wearing a performance
  optimisation's clothes.
- **Item usage/exposure counters** (`usageCount` and everything `record-usage`
  touches, per Week 6's Day 29). Mutated on every delivery; a compiled copy would
  desync from the first request onward.
- **Per-session state** — current SMV posterior/attribute-mastery estimates,
  Assembly Model stopping-rule evaluation (targets met, items delivered so far).
  Obviously per-student and per-session, never library-scoped.

## Invalidation rule

A revision to the Task Model, any of its bound (non-archived) Evidence Models'
structural content (evidence rules, `evidenceActivationMap`, observable set), or
any of its Items' interaction/evidence-activation shape marks the currently
`active: true` `compositeLibrary` entry for that `taskModelId` stale, and delivery
must not serve it again until a fresh compile runs. **Recalibration does not
trigger this** — it's a live lookup, per the decision above, so it needs no
invalidation at all. This is Day 25's exit check ("revising an upstream model
invalidates correctly") and is unaffected by anything this ADR changes in Day
19's already-committed schema; no code follow-up against Day 19's shape is needed
for this ADR, unlike ADR 0002.

## Consequences

- Day 24's builder must resolve parameter pointers to IDs, not values, when
  populating `items[]` — matching the "one pointer, validated on both sides"
  invariant already used throughout `assemblyModels`/`qMatrixModels` (Days 17–18).
- Evidence Identification (Day 27) reads structural facts from the compiled
  package and fetches the active parameter set live in the same request — two
  reads, not one, by design.
- A future "why did this session score differently than yesterday" investigation
  should always check parameterSets/activeParameterSetId first, never suspect
  compositeLibrary staleness for a scoring change — only for a structural one
  (wrong observable targeted, wrong weight applied).
