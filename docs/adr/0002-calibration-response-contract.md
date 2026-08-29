# ADR 0002 — Calibration response contract and provenance fields

**Status:** Accepted
**Date:** 2026-08-28 (Day 20, Week 4)
**Deciders:** ecd-claude build
**Depends on:** ADR 0001 (R for calibration)

## Context

Day 19 added mandatory provenance (`packageVersion`, `converged`, `sampleSize`,
`calibratedAt`) to every `evidenceModels.statisticalModels[].parameterSets[]` entry,
and refused to store a non-converged run. That work happened ahead of this ADR
because the schema declaration for those four fields was unambiguous regardless of
which package produces them. What Day 19 did **not** yet declare is the full
response shape a calibration run produces — specifically, whether standard errors
and fit statistics are part of the stored record, and how loosely-typed they should
be given they vary by model family.

The build reference (Part 4.3) names the full contract: "parameters, standard
errors, fit statistics, convergence flag, package version." Day 19 covered
convergence and package version (plus sample size and date, which the build
reference's Day 19 row separately names). This ADR closes the gap: standard errors
and fit statistics.

## Decision

**Two new optional fields** on `parameterSets[]`, declared in `src/utils/schema.js`
alongside the four Day 19 provenance fields:

- `standardErrors: object` — same key shape as `parameters` (one SE per parameter),
  when the calibration method produces them. Not every method does (a hand-entered
  legacy parameter set may have none); not mandatory.
- `fitStatistics: object` — deliberately **loosely typed**, not a fixed shape. IRT
  fit (M2, RMSEA, item-fit chi-square), CTT fit (KR-20, point-biserial per item) and
  DINA/G-DINA fit (absolute/relative fit indices, classification accuracy) are
  genuinely different vocabularies; forcing one shape now, before the R service
  exists to populate it (W12–13), is schema decided before use — exactly what the
  build reference's Part 0.1 already identifies as a repeat mistake to avoid.

**Neither field is added to the mandatory-provenance check** Day 19 built. Provenance
answers "can I trust this run happened the way it claims" (package, convergence,
sample size, date) — that is answerable and enforceable today, for every model
family, unconditionally. Fit quality is a separable question answerable only once
a real calibration pipeline exists to produce it; declaring the field now and
mandating its shape now are different commitments, and only the first is due this
week.

**Reconciliation with Day 19**: `packageVersion`/`converged`/`sampleSize`/
`calibratedAt` required no change — they already match this contract exactly. The
one addition this ADR requires against Day 19's work is the two new optional fields
above, applied as a follow-up in this same session (see the "Day 20 code follow-up"
handoff note).

## Consequences

- When the R Plumber service (ADR 0001) is built (W12), its JSON response must map
  directly onto `{parameters, standardErrors, fitStatistics, converged,
  packageVersion, sampleSize, calibratedAt}` — no server-side reshaping needed
  between "what R returns" and "what gets stored."
- `fitStatistics`' looseness means no validation can catch a malformed fit-stat
  blob today. That is accepted deliberately per the above; if a real defect class
  emerges once W12's ingestion exists (the build reference's "ingestion refuses a
  non-converged run rather than storing it as a parameter set," Part 4.3), address
  it then with an actual observed failure mode, not a speculative one now.
- `calibrationKind` (Day 19) already ties a parameter set to one of the three
  named calibration file kinds and cross-checks it against the model's `type`; this
  ADR doesn't change that, since kind classification and result-shape are
  orthogonal concerns.
