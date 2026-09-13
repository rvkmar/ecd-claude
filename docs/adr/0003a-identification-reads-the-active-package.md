# ADR 0003a — Identification reads the active package

**Status:** Accepted
**Date:** 2026-09-13 (Day 49c)
**Deciders:** ecd-claude build
**Addendum to:** [ADR 0003 — Composite library denormalisation boundary](0003-composite-library-denormalisation-boundary.md)

## Context

ADR 0003 already decided what is compiled into a `compositeLibrary` package
and what stays a live lookup. Its Consequences section says Evidence
Identification "reads structural facts from the compiled package and fetches
the active parameter set live in the same request."

Until D49c that sentence was aspirational. `identifyEvidence(workProduct,
item, db)` resolved the Evidence Model live from `db.evidenceModels` and
read `scoring.evidenceActivationMap` from the live item. D49a gave the
library an activation caller; D56 re-pointed Activity Selection at the
active package for structural candidate facts. Identification — the path
that turns a work product into an observable value, and therefore the path
whose wrong answer looks like a real score — still re-walked the authoring
graph on every submit.

Scoring against a stale package when the live graph has moved, or scoring
against the live graph when the package has not been rebuilt, are the same
failure class: a plausible-looking wrong score. This addendum adopts ADR
0003's boundary for that path and states what happens when the package is
not fit to use.

## Decision

Identification adopts ADR 0003's boundary, in full:

- **From the active package** for the task's Task Model: presentation /
  interaction params (already baked), `scoring.evidenceActivationMap`, the
  resolved `evidenceRule`, and weights of evidence.
- **Live forever:** calibrated `parameterSets` / `activeParameterSetId`
  (pointer into the Evidence Model's statistical model), usage counts,
  per-session posteriors. Recalibration does not require a library rebuild
  and must take effect on the next score.

The package used is the unique `compositeLibrary` record with
`taskModelId === <the task's Task Model>` and `active === true`. Inactive
packages are not consulted, even if they are the most recent compile.

### Missing, inactive, or stale — refuse, do not score

House style: refuse or advise loudly; never act quietly.

| Condition | What Identification does |
|---|---|
| **No active package** for the Task Model (none compiled, or the only packages are `active: false`) | **Refuse** the score. Do not fall through to `db.items` / `db.evidenceModels` structural fields. |
| **Active package is stale** per `isCompositeLibraryStale` (Task Model or a bound Evidence Model has a higher `versionNumber` than the package was compiled against) | **Refuse** the score. Surface the staleness reasons and point at `POST /api/compositeLibrary/rebuild/:taskModelId`. |
| **Item is not in the active package** | **Refuse** the score. The live item bank is not an alternative catalogue. |
| **Structural authoring changed without a version bump** (e.g. an item's activation map edited in place) | Score against the **package** (the snapshot). The new live map is ignored. A version bump, or an explicit rebuild, is how a structural edit becomes deliverable. |
| **Parameter set flipped, or a new `parameterSet` added, without a rebuild** | Score proceeds. Parameters are resolved live, by pointer, from the Evidence Model. The package is not stale. |

A refused Identification is a **409** on the submit path, not a recorded
response carrying `activated: null` and a warning. Recording a null
identification would look like "the work product matched no pattern" — a
real, reportable outcome — and would silently drop the response from
accumulation. Missing-package and unmatched-pattern are different facts
and must not share a representation.

### What this decision deliberately does not do

- It does not bake parameters into the package (ADR 0003's load-bearing
  line).
- It does not auto-rebuild on Evidence Model writes (D49a: mark stale,
  surface the advisory, require an explicit rebuild).
- It does not change Activity Selection's already-re-pointed read of the
  library (D56). Selection and Identification now share one
  `activePackageFor` lookup so they cannot disagree about which package
  is live.
- It does not claim a browser walk of selection (D56) or D58.

## Consequences

- `identifyEvidence` resolves structural facts through
  `resolveIdentificationStructure` (package entry) and never reads
  `db.evidenceModels` or `item.scoring.evidenceActivationMap` for those
  facts.
- Submit-path weight resolution for raw-score families prefers the
  package-baked `weight` whenever an active package contains the item,
  so a live Task Model edit cannot quietly reweight an already-compiled
  observable.
- Finding F4 is closed: the library has an activation caller (D49a) and
  delivery no longer re-walks the authoring graph for Identification
  structural facts (this addendum).
