// server/delivery/assemblyProgress.js
//
// Day 34 (Week 7): surfaces an Assembly Model's per-SMV accuracy target
// (Day 17 -- `assemblyModels.targetsBySMV`) alongside a freshly-accumulated
// posterior, so a caller can see progress toward a stopping criterion.
//
// resolveAssemblyProgress is deliberately NOT a stopping decision -- it
// answers "how close is this SMV to its stated target right now" for SMVs
// that already have a supported posterior. evaluateDeclaredTargets is the
// join Activity Selection uses to decide targetsMet: every entry in the
// governing Assembly Model's targetsBySMV must appear in that progress
// list and be met. Nothing here is persisted -- it is computed fresh on
// every submit from whatever `accumulateEvidence()` just returned, and is
// surfaced in the HTTP response only (see sessionRoutes.js).
//
// Ambiguity is refused, not guessed at, matching every other module in
// this pipeline: if zero or more than one Assembly Model targets the same
// Competency Model, nothing is reported for it rather than picking one
// arbitrarily. Assembly Models are declared-and-validated-only as of
// Day 17 (no lifecycle wiring, no "operational" gate exists yet for them),
// so there is deliberately no status filter here either -- there is
// nothing meaningful to filter on yet.
//
// Day 56 note: Assembly Models DID get lifecycle wiring at Day 54, and
// activitySelection.js now applies a confirmed/operational filter of its
// own before using any of this for a stopping decision. This module stays
// unfiltered on purpose -- reporting "how close is this SMV to a target a
// draft model declares" is useful, and ENDING a session on it is not the
// same act. The filter belongs at the point of the decision.
//
// Day 57 note: `stoppingCriterionMet` is no longer null for every
// classification-accuracy target -- see the requiredClassificationAccuracy
// branch below and ADR 0004. It remains tri-state: null still means "no
// one evaluated this", which is not the same statement as false.

import { evaluateClassificationTarget } from "./attributeClassification.js";

/**
 * @param {object[]} posteriors - accumulateEvidence()'s `posteriors` array
 * @param {object} db - the full db snapshot
 * @returns {object[]} one entry per SMV with both a resolvable posterior
 *   AND an unambiguous Assembly Model target for it
 */
export function resolveAssemblyProgress(posteriors, db) {
  const progress = [];

  for (const posterior of posteriors || []) {
    if (!posterior.supported || !posterior.competencyModelId) continue;

    const candidates = (db.assemblyModels || []).filter(
      (am) => am.competencyModelId === posterior.competencyModelId
    );

    // Zero: nothing declared for this Competency Model yet. More than
    // one: which applies to THIS session is not stated anywhere -- Day 17
    // scoped Assembly Models to declaration only, with no session-level
    // binding to resolve the ambiguity by. Refusing to guess either way
    // simply means this SMV is omitted from the response, not an error.
    if (candidates.length !== 1) continue;

    const assemblyModel = candidates[0];
    const target = (assemblyModel.targetsBySMV || []).find((t) => t.smvId === posterior.smvId);
    if (!target) continue;

    const entry = {
      smvId: posterior.smvId,
      assemblyModelId: assemblyModel.id,
      estimate: posterior.estimate,
      precision: posterior.precision,
    };

    /* A SEM target is only comparable to a precision on the SAME scale.
       The continuous IRT/Rasch (EAP) branch reports a posterior SD in
       theta units; the attribute-mastery branch reports sqrt(p(1-p)),
       which is bounded by 0.5 and means something entirely different.
       Comparing the two would mark an attribute "measured precisely
       enough" purely because a probability's SD cannot exceed 0.5 --
       schema.js already forbids authoring requiredSEM on a non-continuous
       SMV, so this is a defence against a record whose SMV type changed
       after the Assembly Model was written (`update` does not
       revalidate), not a routine path. Flagged by the Day 36 adversarial
       review.

       Day 39 (adversarial review, P1-6): gated on `posterior.smvType`
       originally, but the scale mismatch this guards against comes from
       the MODEL FAMILY, not the SMV type. RAW_SCORE_SMV_TYPES
       (evidenceAccumulation.js) explicitly allows a CTT/sum/threshold
       model on a `continuous` SMV -- `posterior.smvType === "continuous"`
       in that case, so the old check let a raw-score proportion's SE
       (bounded by 0.5, same scale problem as attribute mastery) straight
       through the comparison it exists to block. Gated on `method`
       instead: only the EAP branch's posterior SD is on the theta scale a
       requiredSEM target is defined against. */
    if (Number.isFinite(target.requiredSEM) && posterior.method !== "eap") {
      entry.requiredSEM = target.requiredSEM;
      entry.stoppingCriterionMet = null;
      entry.note = `A requiredSEM target is defined on the theta scale and cannot be compared to a '${posterior.modelFamily}' model's precision (method: '${posterior.method}').`;
    } else if (Number.isFinite(target.requiredSEM)) {
      entry.requiredSEM = target.requiredSEM;
      entry.stoppingCriterionMet = posterior.precision <= target.requiredSEM;
    } else if (Number.isFinite(target.requiredClassificationAccuracy)) {
      /* Day 57: evaluated at last. attributeClassification.js applies the
         marginal-MAP rule at a stated threshold and reports the posterior
         probability of the class it assigned -- see ADR 0004.

         It still answers `null` for a posterior that is not a mastery
         probability, which is the SAME scale discipline as the requiredSEM
         branch above and for a sharper reason than drift: RAW_SCORE_SMV_TYPES
         includes "binary", and schema.js REQUIRES
         requiredClassificationAccuracy on a binary SMV, so a binary SMV
         carrying a CTT/sum/threshold model produces a "weighted-proportion"
         estimate in [0, 1] -- bounded exactly like a probability, and not
         one -- through entirely valid records. Gating on `method` rather
         than `smvType` is the Day 39 P1-6 correction applied to this side of
         the module before it can be found the hard way. */
      entry.requiredClassificationAccuracy = target.requiredClassificationAccuracy;

      const decision = evaluateClassificationTarget(posterior, target.requiredClassificationAccuracy);
      entry.stoppingCriterionMet = decision.met;

      if (decision.classification !== undefined) {
        entry.classification = decision.classification;
        entry.expectedClassificationAccuracy = decision.expectedClassificationAccuracy;
        entry.masteryThreshold = decision.threshold;
      }
      if (decision.note) entry.note = decision.note;
      if (decision.advisory) entry.advisory = decision.advisory;
    } else {
      // A targetsBySMV entry with neither field set is malformed data,
      // not "no target" -- still surfaced, but with nothing to compare.
      entry.stoppingCriterionMet = null;
    }

    progress.push(entry);
  }

  return progress;
}

/**
 * Join an Assembly Model's declared `targetsBySMV` against progress rows.
 *
 * `resolveAssemblyProgress` only emits a row for an SMV that already has a
 * supported posterior. That is the right answer to "how close is this SMV
 * right now", and the wrong answer to "have we measured everything we said
 * we would": a declared target that never appears in `progress` is
 * unscored, not vacuously met. Activity Selection's `targetsMet` rule uses
 * this join so it cannot stop on "1 of 1 reported" when two targets were
 * declared.
 *
 * `stoppingCriterionMet` stays tri-state. Only `true` counts as met. A
 * missing row, `false`, or `null` (unevaluable -- wrong scale, malformed
 * target) all mean "do not stop".
 *
 * @param {object} assemblyModel - the governing Assembly Model
 * @param {object[]} progress - `resolveAssemblyProgress()` output
 * @returns {{
 *   declaredCount: number,
 *   scoredCount: number,
 *   metCount: number,
 *   allScoredAndMet: boolean,
 *   rows: object[],
 * }}
 */
export function evaluateDeclaredTargets(assemblyModel, progress) {
  const declared = [];
  const seen = new Set();

  for (const target of assemblyModel?.targetsBySMV || []) {
    if (!target?.smvId || seen.has(target.smvId)) continue;
    seen.add(target.smvId);
    declared.push(target);
  }

  const bySmv = new Map();
  for (const row of progress || []) {
    if (!row?.smvId || bySmv.has(row.smvId)) continue;
    // A progress row computed against a different Assembly Model is not
    // evidence that THIS model's declared target was scored.
    if (assemblyModel?.id && row.assemblyModelId && row.assemblyModelId !== assemblyModel.id) {
      continue;
    }
    bySmv.set(row.smvId, row);
  }

  const rows = declared.map((target) => {
    const progressRow = bySmv.get(target.smvId);
    return {
      smvId: target.smvId,
      scored: Boolean(progressRow),
      met: progressRow?.stoppingCriterionMet === true,
      progress: progressRow,
    };
  });

  const scoredCount = rows.filter((r) => r.scored).length;
  const metCount = rows.filter((r) => r.met).length;

  return {
    declaredCount: declared.length,
    scoredCount,
    metCount,
    /* Vacuous truth is the defect this exists to close: zero declared
       targets is "nothing to evaluate", not "everything is met". */
    allScoredAndMet: declared.length > 0 && metCount === declared.length,
    rows,
  };
}
