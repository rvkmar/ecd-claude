# D57 — classification-accuracy stopping + ADR 0004

**Status: DONE** for evaluation. Persist/show of the stop is D58. Report surfaces are D59.

**Exit check (from `b68f308` / ADR 0004):** a DINA/G-DINA attribute-mastery posterior becomes a discrete mastery classification at a stated threshold, with the probability that the assigned class is correct; `assemblyProgress.js` stops returning `null` for every `requiredClassificationAccuracy` target, so a diagnostic session can end on a measurement target instead of only on length. **Met.**

> **Restored 2026-09-13** from `b68f308`, `docs/adr/0004-mastery-classification-decision-rule.md`, `attributeClassification.js`, `assemblyProgress.js`, and `CHANGELOG.md`. No contemporaneous `claude/day57-*.md` was committed.

---

## The gap

Named since D40. `assemblyProgress.js` set `stoppingCriterionMet: null` for every classification-accuracy target ("no decision rule exists yet"). `assemblyModelsRoutes.js` said the field was surfaced but nothing evaluated it. The D54 wizard told authors so on screen.

D56 already ends a session on `maxItems` / `targetsMet` and filters on `stoppingCriterionMet !== true`. A real boolean could flow through without a new orchestrator.

## ADR 0004 — the decision rule

`docs/adr/0004-mastery-classification-decision-rule.md` (accepted, 2026-09-13). Implemented in `server/delivery/attributeClassification.js`.

1. **Marginal MAP at a stated threshold `tau` (default 0.5).** `p > tau` → master; `p < tau` → nonmaster; `p === tau` → **indeterminate**. The exact tie is a real state: `masteryPrior()` returns `{p: 0.5}` when no prior is declared.
2. **Expected classification accuracy is `master ? p : 1 - p`**, not `max(p, 1 - p)`. They agree at 0.5 and diverge under an asymmetric threshold (the rule can assign the *less* probable class). Indeterminate → `null` (no class, so no correctness probability). A null accuracy meets no target.
3. **This is an individual, conditional quantity** — P(the assigned class is true | this examinee's responses). It is **not** the test's population classification-accuracy rate (Wang et al. 2015; `GDINA::CA()`). Averaging per-student figures across a cohort will not produce that rate (biased upward if selection stops early on confident cases). Binding for D79.
4. **Evaluate only against `method === "attribute-mastery-posterior"`.** A binary SMV may carry a CTT/sum/threshold model (`RAW_SCORE_SMV_TYPES` includes `"binary"`; schema requires `requiredClassificationAccuracy` on non-continuous SMVs). That posterior is a weighted proportion of score in [0, 1] — bounded like a probability and not one. Gating on `smvType` would reproduce D39 P1-6 on the other side of the same module. `eap` is theta; classifying it at 0.5 is meaningless.
5. **Threshold is a stated constant, not a new schema field.** Making it authorable is its own unit. D56 refused `assemblyModelId` on sessions for the same cadence reason. The math is already general.
6. **A target at or below the accuracy floor is met, and says so.** At `tau = 0.5` every decided classification has accuracy ≥ 0.5, so `requiredClassificationAccuracy <= 0.5` cannot fail. Schema permits `(0, 1]`. Refusing it would invent a rule; silently meeting it would stop every session on the first scored response with no indication.
7. **Classification is derived, never stored.** Pure function of the persisted posterior + threshold. Storing it would be a second source of truth and would break D68's reproducibility invariant.

## What changed in code

- `assemblyProgress.js` classification branch no longer returns `null` for a mastery posterior.
- **`activitySelection.js` did not change to make stopping work.** Two comments that said classification targets can never stop a session became false and were corrected. The stopped-session record gained classification fields so a diagnostic stop no longer reported `requiredSEM: undefined`.
- Two existing tests kept their assertions and lost their reasons: both used `method: "eap"` fixtures, so they still return `null` — now because of the scale guard, not because no rule exists. Renamed/re-commented; new tests cover D57 behaviour.

## Deliberately not built

- Authorable mastery threshold (still fixed at 0.5 — CHANGELOG Known gaps / ledger).
- Population classification-accuracy index — not implemented, approximated, or claimed.
- **No UI rendered the classification**, and nothing yet explained a stopped session to the student. That is D58 (player) / D59 (reports). The wizard still said the target was unevaluated until D58 discharged that copy.

## Verification (`b68f308`)

| | |
|---|---|
| Full suite | **1129/1129** across 58 files, 53 new |
| Mutations | Twelve run, twelve caught |
| Recovery | All eight attribute profiles over three attributes recovered through the real accumulation |
| Population CA | Out of scope; cadence contract rule 5 is claimed only for the closed-form individual rule |

## F25 (P3)

The dead-export guard is blind to an unused export whose name is also used by another module — confirmed by experiment while adding this module, not by inspection. Logged, not fixed. CHANGELOG Known gaps / ledger still carry it.

## Next

D58 — persist `{ stopped }` on the session and show it in the player. Do not add `sessionOrchestrator.js`.
