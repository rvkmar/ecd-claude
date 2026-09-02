# Day 39 — Adversarial review of all accumulation math

**Exit check (build reference):** Written findings list ranked by severity; every P0 fixed same day with a regression test.

**Status: DONE.**

## Process

Per the standing instruction, a fresh Agent (no shared context with the session that wrote Day 31–38's accumulation code) was spawned specifically to try to REFUTE the week's work — `evidenceAccumulation.js` (continuous/IRT), `attributeAccumulation.js` (DINA/G-DINA), `assemblyProgress.js`, and the Day 38 pilot/calibrated parameter-source plumbing through `sessionRoutes.js`. It verified every claim by running code, not by reading comments.

## Findings (ranked)

**P0 — wrong posterior a user would trust:**
1. **SMV collision across Evidence Models.** If two Evidence Models both resolve to the same Student Model Variable, `accumulateEvidence()` computed two independent posteriors for it. Persisting either would silently discard the other's evidence — worse, which one "won" depended on `Map` iteration order over the session's responses.
2. **Wrong effective sample size in raw-score SE.** `estimateRawScore()` used `nEff = totalWeight` even when weights weren't 0/1 counts (e.g. Task-Model-declared per-observable weights), producing a frozen SE that didn't shrink with test length and was overconfident whenever weights weren't uniform.
3. **Pilot parameters re-resolved live instead of pinned.** A pilot-sourced response was scored against the ITEM's *current* `psychometrics.irtParams` on every accumulation pass, so an author editing an item's pilot a/b after students had already responded would silently rewrite every past session's historical posterior — a direct violation of Decision 1's reproducibility invariant.

**P1 — edge-case wrong or crash:**
4. DINA/G-DINA reported every attribute as `supported: true` with `responsesUsed` counted across ALL scored responses, even for an attribute no submitted item's Q-vector actually required.
5. `sessionRoutes.js` discarded `accumulateEvidence()`'s `warnings` array entirely — every silently-excluded response (uncalibrated observable, bad IRT params, unrecognised direction...) was invisible to the caller.
6. `assemblyProgress.js` gated its theta-scale guard on `smvType !== "continuous"`, but `RAW_SCORE_SMV_TYPES` explicitly permits a raw-score (CTT/sum/threshold) model on a `continuous` SMV — so a raw-score proportion's bounded-by-0.5 SE could pass straight through a `requiredSEM` comparison meant only for the EAP theta scale.

**P2 — minor/cosmetic, still fixed where cheap:**
7. `gdinaTableIsMonotonic` compared table rows using plain binary-counter adjacency, but the table is actually indexed in graded-lexicographic order (`REDUCED_PATTERN_ORDER`) — the two coincide only for 2 required attributes, so the monotonicity *warning* (never a refusal) was checking the wrong row pairs for 3+.
8. The continuous branch's success object never propagated `refined`, so `applyPosteriorsToSession`'s read of `posterior.refined === true` always saw `undefined`.
9. A fully untagged response (no `parameterSource`, no `parameterSetId`) is silently absorbed into a tagged group-mate's source instead of being flagged as its own ambiguous source. **Deferred** — narrow (malformed/hand-edited data only), and fixing it well means new refusal UX for a fourth source kind.
10. A raw-score session split across the Day 38 deploy, spanning multiple Evidence Models, can spuriously refuse one Evidence Model's legacy-only responses. **Deferred** — non-fatal, shrinking migration window, requires reordering the grouping step to know the family before resolving source.

**Checked and found solid:** the mid-session recalibration freeze itself (a response's `parameterSetId`/`pilotParams` snapshot is genuinely immune to later recalibration — confirmed correct, not a bug), determinism, prior recovery, and the DINA/G-DINA saturated-table equivalence.

## Fixes applied

All 3 P0s, 2 of 3 P1s (5 and 6), and 1 of 4 P2s (7 and 8) were fixed same day, each with a regression test:

- `evidenceAccumulation.js`: post-pass detects SMV-collision and marks every claimant `supported: false` with an explicit reason naming the colliding Evidence Models; `estimateRawScore()` now computes Kish's effective sample size (`nEff = (Σw)² / Σ(w²)`) instead of `nEff = Σw`; pilot-sourced responses score from a new `r.pilotParams` snapshot (taken by `sessionRoutes.js` at submit time) instead of the item's live `psychometrics.irtParams`.
- `attributeAccumulation.js`: DINA/G-DINA marginals now report `supported: false` for any attribute no scored response's Q-vector required, instead of a false `responsesUsed` count; `gdinaTableIsMonotonic` now translates both compared masks through the same graded-lex ranking the table is actually indexed by (new `gradedLexIndexOfMask` helper).
- `assemblyProgress.js`: the theta-scale guard now gates on `posterior.method !== "eap"` rather than `smvType`, so a raw-score posterior is refused the comparison regardless of which SMV type it's attached to.
- `sessionRoutes.js`: `/submit`'s response now includes `accumulationWarnings` (previously silently dropped).
- P2-9 and P2-10 are documented inline at the `effectiveSource` resolution point in `evidenceAccumulation.js` as known, deliberately deferred gaps, not silently dropped.

New/updated regression tests: `evidenceAccumulation.test.js` gained dedicated P0-1 (SMV collision, both directions) and P0-3 (pilot-parameter pinning, including the "no pilotParams on an old response" degrade case) tests, plus the existing P0-2 (uniform-weight nEff) coverage from the same pass. `attributeAccumulation.test.js` gained two m=3 `gdinaTableIsMonotonic` tests (one proving the fix, one proving real non-monotonicity is still caught) and updated the untouched-attribute assertions. `assemblyProgress.test.js` gained the raw-score-vs-continuous-SMV test.

Full suite: **838/838 passing.** Production build: clean.

## Next

Day 40 per the calendar: "W7-8 close, handoff, and W9 prep."
