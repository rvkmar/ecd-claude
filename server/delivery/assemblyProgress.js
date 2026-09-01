// server/delivery/assemblyProgress.js
//
// Day 34 (Week 7): surfaces an Assembly Model's per-SMV accuracy target
// (Day 17 -- `assemblyModels.targetsBySMV`) alongside a freshly-accumulated
// posterior, so a caller can see progress toward a stopping criterion.
//
// Deliberately NOT a stopping decision. Activity Selection / stopping
// rules are Week 11 scope; this module only ANSWERS "how close is this
// SMV to its stated target right now", and never decides whether to stop
// presenting items. Nothing here is persisted -- it is computed fresh on
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
       The continuous branch reports a posterior SD in theta units; the
       attribute-mastery branch reports sqrt(p(1-p)), which is bounded by
       0.5 and means something entirely different. Comparing the two would
       mark an attribute "measured precisely enough" purely because a
       probability's SD cannot exceed 0.5 -- schema.js already forbids
       authoring requiredSEM on a non-continuous SMV, so this is a
       defence against a record whose SMV type changed after the Assembly
       Model was written (`update` does not revalidate), not a routine
       path. Flagged by the Day 36 adversarial review. */
    if (Number.isFinite(target.requiredSEM) && posterior.smvType && posterior.smvType !== "continuous") {
      entry.requiredSEM = target.requiredSEM;
      entry.stoppingCriterionMet = null;
      entry.note = `A requiredSEM target is defined on the theta scale and cannot be compared to a '${posterior.smvType}' Student Model Variable's precision.`;
    } else if (Number.isFinite(target.requiredSEM)) {
      entry.requiredSEM = target.requiredSEM;
      entry.stoppingCriterionMet = posterior.precision <= target.requiredSEM;
    } else if (Number.isFinite(target.requiredClassificationAccuracy)) {
      // A classification-accuracy target needs a decision rule (posterior
      // -> discrete classification) this pipeline does not compute yet --
      // that is Activity Selection/W11 territory. The target is still
      // surfaced so it is visible, but whether it has been met is left
      // unevaluated rather than approximated from a continuous estimate
      // that was never meant to answer a classification question.
      entry.requiredClassificationAccuracy = target.requiredClassificationAccuracy;
      entry.stoppingCriterionMet = null;
    } else {
      // A targetsBySMV entry with neither field set is malformed data,
      // not "no target" -- still surfaced, but with nothing to compare.
      entry.stoppingCriterionMet = null;
    }

    progress.push(entry);
  }

  return progress;
}
